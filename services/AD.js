const { SerializeXML,SerializeAD  } = require('../utils');
const { ADDetails } = require('./SOAP');

exports.ADProfile = async (username) => {
    
      let ADDetailsParams = {
        xusername : username
      }

      let responseFromAD = await ADDetails(ADDetailsParams)
      const adProfile = await SerializeXML(responseFromAD[0].GetInfo2Result)
      return SerializeAD(adProfile.root.record[0])
}