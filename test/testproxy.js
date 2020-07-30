const getters = require('../services/proxy/getterProxy');
const setters = require('../services/proxy/setterProxy');
 
 async function setter() {
      try {
        upgrade = await setters.upgradeTo('0xD229E2079BDBc3621bF2b31a9C68E8093cC80Cb7');
          console.log(upgrade)
      } catch (error) {
        console.log(error)
      }
   
}
//setter()

async function getter() {
  try {
    await getters.proxyOwner();
  } catch (error) {
    console.log(error)
  }

}
//getter()
