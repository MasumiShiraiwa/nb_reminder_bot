const axios = require("axios");


/**
 * Send message to a user
 * @async
 * @param {Object} content - Message Content
 *  "content": {
    "type": "text",
    "text": "[message]"
  }
 * 
 * 
 * @param {string} botId - Bot ID
 * @param {string} userId - User ID
 * @param {string} accessToken - Access Token
 * @return {Object} response
 */
  let sendMessageToUser = async (content, botId, userId, accessToken) => {
    const headers = {
        Authorization: `Bearer ${accessToken}`
    };

    try{
        const res = await axios.post(`https://www.worksapis.com/v1.0/bots/${botId}/users/${userId}/messages`, content,
            { headers }
        );
        return res;
    }catch(e){
        console.error("Error sending message to user:", e.message);
        if(e.response){
            console.error("HTTP Status:", e.response.status);
            console.error("Response Data:", e.response.data);
        }
    }
};

let sendErrorToDevelopper = async (errorMessage, botId, developerId, accessToken) => {
  const headers = {
      Authorization: `Bearer ${accessToken}`
  };

  let content = {
    content: {
        type: "text",
        text: errorMessage
    }
  }
  try{
    const res = await axios.post(`https://www.worksapis.com/v1.0/bots/${botId}/users/${developerId}/messages`, content,
      { headers }
    );
    return res;
  }catch(e){
    console.error("Error sending message to user:", e.message);
    if(e.response){
        console.error("HTTP Status:", e.response.status);
        console.error("Response Data:", e.response.data);
    }
  }

};


/**
 * Download file from message
 * @async
 * @param {string} botId - Bot ID
 * @param {string} fileId - File ID
 * @param {string} accessToken - Access Token
 * @return {Object} textData - Text data
 */
let downloadFromMessage = async (botId, fileId, accessToken) => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`
        };
  
        // Get redirect URL from API
        const res = await axios.get(
            `https://www.worksapis.com/v1.0/bots/${botId}/attachments/${fileId}`,
            {
                headers: headers,
                maxRedirects: 0, // Prevent automatic redirection
                validateStatus: status => status === 302 || (status >= 200 && status < 300)
              }
        );
  
        console.debug("responce for getting redirect URL: ", res.headers);
  
        // Get redirect URL only if status is 302
      if (res.status === 302) {
          const downloadUrl = res.headers.location;
          if (!downloadUrl) {
            throw new Error("リダイレクト URL が見つかりません");
          }
    
          // リダイレクトURLからファイルをストリームで取得
          const fileResponse = await axios.get(downloadUrl, {
            headers: headers,
            responseType: "stream"
          });
  
    
          // ステータスコードチェック
          if (fileResponse.status < 200 || fileResponse.status >= 300) {
            throw new Error(`ファイルダウンロードに失敗しました: ${fileResponse.status}`);
          }
          
          // ストリームをバッファとして読み込む
          const buffers = [];
          await new Promise((resolve, reject) => {
              fileResponse.data.on("data", (chunk) => buffers.push(chunk)); // データをバッファに追加
              fileResponse.data.on("end", resolve); // 受信完了
              fileResponse.data.on("error", reject); // エラー処理
          });
  
          // 🔹 バッファを1つのファイルデータに統合
          const fileBuffer = Buffer.concat(buffers);
  
          // ファイルをXLSXとして読み込む
          const workbook = XLSX.read(fileBuffer, {type: "buffer"});
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
          console.log("sheetData: ", sheetData, "type: ", typeof(sheetData));
          console.log("sheetData[0]: ", sheetData[0]);
  
          let textData = fileConverter.excelToTxt(sheetData);
          console.log("textData: ", textData);
  
          // Driveにファイルをアップロード
  
          return await textData; // ファイルの内容を配列として返す
    
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
  
    } catch (error) {
      console.error("Error downloading file:", error.message);
      if (error.response) {
          console.error("HTTP Status:", error.response.status);
          console.error("Response Data:", error.response.data);
      }
      throw error;
    }
  }



  module.exports = {
    sendMessageToUser,
    sendErrorToDevelopper,
    downloadFromMessage
  };
  
