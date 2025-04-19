const { datacatalog } = require("googleapis/build/src/apis/datacatalog");

/**
 * Convert Excel file to TXT file
 * @param {Array} excelData - list of Excel file data
 * @returns {Array} textData - list of TXT file data
 */
let excelToTxt = (excelData) => {
    // ファイルデータを配列として受け取る
    // 配列の中身は、[
    //     [
    //         
    //     ]
    
    // textDataの中身は、[
    //     [
    //         {
    //             id: "id".
    //             time: "time".
    //         }, ..., {}
    //     ],
    //     [
    //         {
    //             id: "id".
    //             time: "time".
    //         }, ..., {}
    //     ],
    // ]
    let textData = [];
    const idCol = 0; // 【要変更】社員IDの列
    const totalRow = 4; // 【要変更】"Total"の行
    let col = 4; // シフト表の最初の列で初期化
    const max_row = excelData.length
    while(true){
        if(excelData[totalRow][col] === "Total"){ //【要変更】"Total"の列で終了
            break;
        };

        let date = [];
        //ここから各行を見ていく
        //まず、０列目に社員IDがあれば(=nullでなければ)、colの列を取得する
        let row = 17; //【要変更】最初に社員IDがある行(荒川さんの行)で初期化
        while(row < max_row){
            if(excelData[row][idCol] == null || excelData[row][col] == null){
                row += 2;
                continue;
            }
            date.push({
                id: excelData[row][idCol],
                time: excelData[row][col],
            });
            row+=2;
        }

        // textData.push(JSON.parse(JSON.stringify(date)));
        textData.push(date);
        col++;
    }

    console.log("textData: ", textData);
    Error

    return textData;
};

module.exports = {
    excelToTxt,
};
