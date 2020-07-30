const SterlingShares = artifacts.require('SterlingShares');
const assert = require('chai').assert;
const truffleAssert = require('truffle-assertions');


contract('SterlingShares', accounts => {

  beforeEach(async ()=>{
      this.token = await SterlingShares.new()
  });

  // it("Shold initialize constructor successfully", async ()=>{
      
  //   try {
  //     initialize =  await this.token.initialize();
  //     const requiredapprove = await this.token.requiredApprovals.call();
  //     const admins = await this.token.getadmins.call();
  //     console.log('Required Approvals >>>', requiredapprove.toNumber());
  //     console.log('Admins >>', admins)
      
  //   } catch (error) {
  //     console.log(error)
  //   }
  //   assert.equal(initialize.receipt.status, true, "Unable to Generate Token. Schedule not created");
  // })

  it("Is able to generate token mint successfully", async ()=>{
    let scheduleid = 1000;
    let Error;
    
    try {
       scheduleid =  await this.token.createSchedule(scheduleid);
       console.log('Schedule ID>>>', scheduleid)
    } catch (error) {
      console.log(error)
    }
    assert.equal(scheduleid.receipt.status, true, "Unable to Generate Token. Schedule not created");
  })


  it("should whitelist users", async ()=>{
    _user = "0x19da450610ad2dcaad4e1744d45d94061d40cb6b"
    try {
      
      whitelist = await this.token.setWhiteList(_user);
      _event = await this.token.getPastEvents( 'SetWhiteList', { fromBlock: 0, toBlock: 'latest' })
    } catch (error) {
      console.log(error)
    }
    assert.equal(_event[0].args._addr, web3.utils.toChecksumAddress(_user), "Unable to whitelist the modafucker")
  })

  it("should set, get and remove whitelisted user", async ()=>{

    _user = "0x19da450610ad2dcaad4e1744d45d94061d40cb6b"
    try {
        await this.token.setWhiteList(_user).then( async result => {
        assert.equal(result.receipt.status, 1, 'User not whitelisted')

        _event = await this.token.getPastEvents( 'SetWhiteList', { fromBlock: 0, toBlock: 'latest' })
        //console.log('Event: ',_event[0].args._addr)

        await this.token.getWhiteList().then( result => {
          //List of Whitelisted users
          console.log('WhiteListed Users >>> ', result)
        }).then( async () => {
          //remove user from whitelist
          removed = await this.token.removeWhiteList(_user)
          //console.log(removed)
          assert.equal(removed.receipt.status, 1, 'Cannot remove modafucker user from blacklisted')

          //get whitelistd users
          removelist =  await this.token.getWhiteList()
          console.log('Remove WhiteListed>>>', removelist)
        })
      })
    } catch (error) {
        console.log(error)
    }
  })

  it('should prevent user not whitelisted from transfering token', async () => {
   
      _superadmin = accounts[0]
      _authorizer = accounts[1]
      _authorizer2 = accounts[7]
      _admin = accounts[2]
      //_whitelist1 = '0x0c428d31db99228ae0a3080d85b2b3d7700791b7'
      _whitelist1 = accounts[3]
      _whitelist2 = accounts[4]
      _notwhitelist = accounts[5]
      _tokensMint = 10000
      _mintAmount = 5000
      _approveAmount = 2000
      _tranferAmount = 3000
      requiredApprovals = 2


          //change requirement
          //await this.token.changeRequirement(requiredApprovals)
        

          //add authorizer
           await this.token.addauthorizer(_authorizer2)
           await this.token.addauthorizer(_authorizer).then( async addauthorizer => {
             //console.log('authorizer>>>', addauthorizer)
             authorizers = await this.token.getauthorizers()
             console.log('get authorizers >>', authorizers)

          //change requirement
          await this.token.changeRequirement(requiredApprovals)

            assert.equal(addauthorizer.receipt.status, 1 , 'add authorizer by super admin failed')
           }).then(
             //add admin
            addadmin = await this.token.addadmin(_admin),
            assert.equal(addadmin.receipt.status, 1, 'add admin by super admin failed')
           ).then(
            //create mint schedule
            mint = await this.token.createSchedule(_tokensMint,{from: _admin}),
            assert.equal(mint.receipt.status, true, 'create schedule mint by approved admin failed')
           ).then(async ()=>{
            //get event
            _event = await this.token.getPastEvents( 'NewSchedule', { fromBlock: 0, toBlock: 'latest' });
            schedule = _event[0].args.scheduleId.toNumber();
            return schedule
           }).then(
          //approve schedule by authorizer
          authorizeschedule1 = await this.token.approveSchedule(schedule, true, 'Bad work', {from: _authorizer}),
          authorizeschedule2 = await this.token.approveSchedule(schedule, true, 'Good work', {from: _authorizer2}),
          console.log('Authorizer Schedule 1 >>>',authorizeschedule1.receipt.status),
          //console.log('Authorizer Schedule 2 >>>',authorizeschedule2.receipt.status),

          //get approvals
          Authorizers = await this.token.getapprovals(schedule),
          console.log('Authorizers >>', Authorizers),

          isApprove = await this.token.isApproved(schedule),
          console.log('Approved >>>',isApprove.toNumber()),
          assert.equal(authorizeschedule1.receipt.status, true, 'approve schedule mint by authorizer failed')
           ).then(
          //whitelist user by super admin
          await this.token.setWhiteList(_whitelist1),
          whitelisting = await this.token.setWhiteList(_whitelist2),
          assert.equal(whitelisting.receipt.status, true, 'whitelist user by super-admin failed')
           ).then(
          //generate and distribute token
          mint = await this.token.generateToken(schedule, _whitelist1, _mintAmount, {from: _admin}),
          //console.log('Mint and Distribute Token >>>', mint),
          assert.equal(mint.receipt.status, true, 'Token not minted to user')
           ).then(
          //transfer from Lien balance to Tradeable balance
          transfer = await this.token.approve(_superadmin, 100,{from: _whitelist1}),
          console.log('Approve Transfer 1>>>', transfer.receipt.status),

          newBalance = await this.token.balanceOf(_whitelist1),
          console.log('New Balance >>', newBalance.toNumber()),

          transfer2 = await this.token.increaseAllowance(_superadmin, 300,{from: _whitelist1}),
          console.log('Increase Allowance>>>', transfer2.receipt.status),

          newBalance2 = await this.token.balanceOf(_whitelist1),
          console.log('New Balance2 >>', newBalance2.toNumber()),

          allowance = await this.token.allowance(_whitelist1,_superadmin),
          console.log('SuperAdmin Allowance >>', allowance.toNumber()),

          //transfer token back to owner
          moveescrow = await this.token.transfertoken(_whitelist1, {from: _superadmin}),
          //console.log('Original Balance >>', moveescrow),

          assert.equal(transfer.receipt.status, true, 'Token not transfered from Lien to Tradeable')
           ).then(
            balances = await this.token.getTotalBals(),
            console.log("Total Supply >>>",balances.toNumber())
           ).then(
            
            //Attempt to send token to whitelisted user
          //Wtransfer = await this.token.transfersTo(_whitelist2, 300,{from: _whitelist1}),
          //assert.equal(Wtransfer.receipt.status, true, 'Token transferred by whitelisted user to modafuker receiver failed'),
          balSender = await this.token.balanceOf(_whitelist1),
          balReceiver = await this.token.balanceOf(_whitelist2),
          console.log('Sender Balance >>>', balSender.toNumber()),
          console.log('Receivers Balance >>>', balReceiver.toNumber()),

          //Zero Balance after trading cycle
          await this.token.zeroBalance(_whitelist1),
          zerobal =  await this.token.balanceOf(_whitelist1),
          console.log('New Sender Balance >>', zerobal.toNumber()),
           )   
    
  })

    it('returns Lien and Tradeable balances', async ()=>{
      try {
        await this.token.setWhiteList(accounts[9]),
        await this.token.getTokenBals(accounts[9]).then( balances => {
          //console.log('Balances>>>', balances)
        });
        
      } catch (error) {
        console.log(error)
      }
      //assert.equal(_event[0].args._addr, web3.utils.toChecksumAddress(_user), "Unable to whitelist the modafucker")
    
      
    })

});