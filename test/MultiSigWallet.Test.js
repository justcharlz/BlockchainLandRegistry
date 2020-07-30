const MultiSigWallet = artifacts.require('MultiSigWallet');
const assert = require('chai').assert;
const truffleAssert = require('truffle-assertions');

contract('MultiSigWallet', accounts => {

    beforeEach(async ()=>{
        this.wallet = await MultiSigWallet.new()
    });

    //unit tests
        it("Is onlyOwner that deployed contract as SuperAdmin", async ()=>{
                const Superadmin = await this.wallet.owner.call();
                assert.equal(Superadmin, accounts[0]);
        });

        it("Gets required approvals", async ()=>{
            const requiredapprove = await this.wallet.requiredApprovals.call();
            console.log('Required Approvals >>>', requiredapprove.toNumber());
        });

        it("Is able to get admin(s) address", async ()=>{
            let admins;
            admins = await this.wallet.getadmins.call();
            assert.equal(admins[0],accounts[0],"Fail admin not here")
        })

        // it("Is only superAdmin that can add more admins", async ()=>{
        //         let _requiredApprovals = 1;
        //         let admins;
        //         await this.wallet.addadmin(accounts[2],{from: accounts[0]})
        //         admins = await this.wallet.getadmins.call();
                    
        //         assert.equal(admins[1],accounts[2], "Only superAdmin can add admins");
        // })

        it("Is only Approved admin can interact with create schedules", async ()=>{
            let _tokensmint = 1000;
            let _admin = accounts[0];
            let _unauthorised = accounts[1];
            let Error;
            try {
                await this.wallet.createSchedule(_tokensmint, {from: _unauthorised});
            } catch (error) {
                    Error = error;
            }
            assert.notEqual(Error, _admin, "Only superAdmin can call schedules");
        })

        it("Is only Approved admin can schedules token mint successfully", async ()=>{
            let _tokensmint = 1000;

            try {
               _mint =  await this.wallet.createSchedule(_tokensmint)
            } catch (error) {
                console.log(error.reason)
            }
            assert.equal(_mint.receipt.status, true, "Transaction fail. Schedule not created");
        })

        it("Approved admin creates token mint successfully", async ()=>{
            let _tokensmint = 1000;
           addmin =  await this.wallet.addadmin(accounts[1])
           
            try {
                 await this.wallet.createSchedule(_tokensmint,{from: accounts[1]})
               
            } catch (error) {
                console.log(error.reason)
            }
            assert.equal(_mint.receipt.status, true, "Transaction fail. Schedule not created");
        })

        it("Is able to add authorizer, create, approve mint, verify mint schedule", async ()=>{
            
            let _tokensmint = 1000;

            //add authorizer
            //await this.wallet.addauthorizer(accounts[0])
            await this.wallet.addauthorizer(accounts[7])
            authorizers = await this.wallet.getauthorizers()
            console.log('authorizers>>>', authorizers)

            //create mint schedule
            minted = await this.wallet.createSchedule(_tokensmint)
            //console.log('Minted >>>',minted)

            //check schedulecount
            await this.wallet.scheduleCount.call().then(
               async result => {

            //get event
            _event = await this.wallet.getPastEvents( 'NewSchedule', { fromBlock: 0, toBlock: 'latest' });
            
            schedule = _event[0].args.scheduleId.toNumber()
            console.log('Schedule ID >>>',schedule)
            
            //approve schedule by authorizer
            approvemint = await this.wallet.approveSchedule(schedule, true, 'nice done', {from: accounts[7]})
            approved = await this.wallet.isApproved(schedule)
            //console.log('approval >>>', approved.toNumber())

            //validate schedule
            scheduled = await this.wallet.validateSchedule(schedule)

            console.log("Scheduled>>>",scheduled.toNumber())
                assert.equal(scheduled, '1000', "Transaction fail. Schedule not created");
                }
            );
            
            //assert.equal(_mint.receipt.status, true, "Transaction fail. Schedule not created");
               })
    
})