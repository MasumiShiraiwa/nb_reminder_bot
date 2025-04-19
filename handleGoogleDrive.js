const { text } = require("express");
const { google } = require("googleapis");
const XLSX = require("xlsx");
const stream = require("stream");
const { json } = require("stream/consumers");
const { file } = require("googleapis/build/src/apis/file");

const SCOPES = [`https://www.googleapis.com/auth/drive`]

let authorize = async () => {
    console.log("GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("GOOGLE_PRIVATE_KEY exists:", !!process.env.GOOGLE_PRIVATE_KEY);

    console.log("--------------------------------");
    console.log("Get Access Token");
    // JWT認証
    // const auth_JWT = new google.auth.JWT(
    //     process.env.GOOGLE_CLIENT_EMAIL,
    //     null,
    //     process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // 改行処理
    //     SCOPES
    // );
    
    // クライアントシークレット
    // const drive = google.drive({version: "v3", auth});
    const auth = new google.auth.GoogleAuth({
        scopes: SCOPES,
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        },
    });
    
    const authClient = await auth.getClient();
    const drive = google.drive({version: "v3", auth: authClient});

    return drive;
};

let getListOfFiles = async () => {
    const drive = await authorize();
    const params = {pageSize: 100,
        q: 'trashed = false' + ' and ' + '"' + process.env.NB_FOLDER_ID + '" in parents'
    }
    console.log("Get List of Files");
    try{
        const res = await drive.files.list(params);
        console.log("res.data.files", res.data.files);
        return res.data.files;
    }catch(err){
        console.log("Error in getListOfFiles", err);
        return [];
    }
};

let getExcelFile = async (fileId) => {
    const drive = await authorize();
    let file;
    file = await drive.files.get({fileId: fileId, alt: "media"}, {responseType: "stream"});

    // try{
    //     file = await drive.files.get({fileId: fileId, alt: "media"}, {responseType: "stream"});
    // }catch(err){
    //     console.log(err);
    //     return null;
    // }

    // ストリームをバッファとして読み込む
    const buffers = [];
    await new Promise((resolve, reject) => {
        file.data.on('data', (chunk) => buffers.push(chunk));
        file.data.on('end', resolve);
        file.data.on('error', reject);
    });

    // バッファを1つのファイルデータに統合
    const fileBuffer = Buffer.concat(buffers);

    // ファイルをXLSXとして読み込む
    const workbook = XLSX.read(fileBuffer, {type: "buffer"});
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
    

    return sheetData; // 一時的にファイルの内容を配列として返す

};

let moveExcelFileToTrash = async (fileId) => {
    const trashFolderId = "1tFLeL9H8BeBsEQkxLI6hhT5jmLedq7dp";
    const drive = await authorize();
    console.log("Delete the excel file:", fileId);
    
  try {
    // 1. 対象ファイルの親フォルダを取得
    const file = await drive.files.get({
      fileId,
      fields: 'parents',
      supportsAllDrives: true
    });

    const currentParents = file.data.parents?.join(',') || '';
    if (!currentParents) {
      console.warn('親フォルダが見つかりません');
      return false;
    }

    // 2. フォルダ移動（親フォルダを削除し、Trashedに追加）
    
    const params = {
        fileId,
        addParents: trashFolderId,
        removeParents: currentParents,
        supportsAllDrives: true
      };
    const response = await drive.files.update(params);

    console.log('Trashedフォルダへ移動完了:', response.data);
    return true;
  } catch (err) {
    console.error('フォルダ移動中にエラー:', err.message || err);
    return false;
  }

}

let postJsonFile = async (fileId,textData, fileName) => {
    const drive = await authorize();

    const jsonData = JSON.stringify(textData, null, 2)

    const bufferStream = new stream.PassThrough();
    bufferStream.end(jsonData);

    console.log(`jsonData: ${jsonData}`);

    console.log("upload json file");
    const res = await drive.files.create({
        requestBody: {
            name: fileName + ".json",
            mimeType: "application/json",
            parents: [fileId], // Google DriveのフォルダID
        },
        media: {
            mimeType: "application/json",
            body: bufferStream,
        },
    });

    console.log("File uploaded succesfully: ", res.data);

};

let updateJsonFile = async (fileId,textData) => {
    const drive = await authorize();

    const jsonData = JSON.stringify(textData, null, 2)

    const bufferStream = new stream.PassThrough();
    bufferStream.end(jsonData);

    console.log(`jsonData: ${jsonData}`);

    console.log("update json file");
    const res = await drive.files.update({
        fileId: fileId,
        requestBody: {},
        media: {
            mimeType: "application/json", // ファイルの MIME タイプ
            body: bufferStream, // 新しいデータ
        },
    });

    console.log("File updated succesfully: ", res.data);

};

let getJsonFile = async (fileId) => {
    const drive = await authorize();
    let file;
    file = await drive.files.get({fileId: fileId, alt: "media"}, {responseType: "stream"});
    // try{
    // }catch(err){
    //     console.log(err);
    //     return null;
    // }

    // ストリームをバッファとして読み込む
    const buffers = [];
    await new Promise((resolve, reject) => {
        file.data.on('data', (chunk) => buffers.push(chunk));
        file.data.on('end', resolve);
        file.data.on('error', reject);
    });

    // バッファを1つのファイルデータに統合
    const fileBuffer = Buffer.concat(buffers);

    let jsonData = JSON.parse(fileBuffer);
    console.log("jsonData: ", jsonData, "type: ", typeof(jsonData));

    return jsonData;
}

module.exports = {getListOfFiles, getExcelFile, moveExcelFileToTrash, postJsonFile, updateJsonFile, getJsonFile};