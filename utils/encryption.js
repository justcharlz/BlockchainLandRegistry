
const crypto = require('crypto');
const { Config } = require("./config");
const { HttpStatus, GetCodeMsg, Errors, GetLoggerInstance } = require('./utils');
/*
 *  TRIPLEDESCRYPTO CLASS
 *  Dev Oluchi Enebeli
 *  Date: 2019
 * 
 */

 
const BinaryToString = async (binary) => {
    try {
        
        if(binary.length < 8 || (binary.length % 8) != 0)
        return "";

        binary = binary.replace(/\s+/g, '')
        var builder = "";
        for(var i = 0; i < binary.length; i += 8){
                var sub = binary.substring(i, i + 8);  
            var ascii = String.fromCharCode(parseInt(sub, 2));
            builder += ascii;
        }

        return builder;

    }catch(error){
  
        err = {
          errCode :  Errors.ENCRYPTIONERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}  

exports.Encrypt = async (plain) => {
    try
    {
        const vector = await BinaryToString(Config.IBSIV)
        const key = await BinaryToString(Config.IBSKeY) 

        const cipher = await crypto.createCipheriv('des-ede3-cbc', key, vector);
        return cipher.update(plain, 'utf8', 'base64') + cipher.final('base64')
        
    }catch(error){
        err = {
          errCode :  Errors.ENCRYPTIONERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.Decrypt = async (encrypted) => {
    try {

        const vector = await BinaryToString(Config.IBSIV)
        const key = await BinaryToString(Config.IBSKeY) 
  
        const toDecrypt = Buffer.from(encrypted , 'base64');           
        const decipher = await crypto.createDecipheriv('des-ede3-cbc', key, vector);
        return decipher.update(toDecrypt, 'base64', 'utf8') + decipher.final('utf8')
        
    }catch(error){
        err = {
          errCode :  Errors.DECRYPTIONERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

// (exports.() {
//     console.log("encrypted >> ", await encrypt("IBS Spay"))
//     console.log("decrypted >> ", await decrypt("zrhLO6PwLheJJrap21qEwQ=="))
// }())