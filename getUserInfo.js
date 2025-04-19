const axios = require("axios");

/**
 * Get user information
 * details : https://developers.worksmobile.com/jp/docs/user-get?lang=ja
 * @async
 * @param {string} userId - User ID
 * @param {string} accessToken - Access Token
 * 
 * @return {Object} response
 */

let getUserInformation = async (userId, accessToken) => {
    console.log("get user information");
    const headers = {
        Authorization: `Bearer ${accessToken}`
    };

    try{
        const res = await axios.get(`https://www.worksapis.com/v1.0/users/${userId}`, {headers});
        return res;
    }catch(e){
        console.error("Error getting user information:", e.message);
        if(e.response){
            console.error("HTTP Status:", e.response.status);   
            console.error("Response Data:", e.response.data);
        }
    }
    
};

module.exports = { getUserInformation };