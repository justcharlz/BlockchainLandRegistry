pragma solidity ^0.5.0;

//import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./Ownable.sol";
import "./ExternalStorage.sol";
import "./LandRegistry.sol";

/**
 * @dev Contract module which provides a basic storage system.
 *
 * This module is used through inheritance. It will make available the contract
 * addresses created, owners of the contract and land record detailing land documentations.
 */

contract LandRegistryLogic is ExternalStorage{

    mapping (bytes32 => LandRegistry) private _LandRegistry;
    mapping (bytes32 => landDetails) private _LandDetail;
    mapping (address => addrcontracts[]) public _ContractAdd;
    //address[] public contractAdd;
    struct addrcontracts {
        address contractad;
    }
    //address[][] _contractadd;
    mapping(address => properties) property;
    struct properties{
        LandRegistry[] assets;
        }

    //modifier
    modifier checkRegistrar(address _RegistryID)
    {
        require(registry[_RegistryID].RegistryID == _RegistryID, 'Registrar ID not registered');
        _;
    }

    modifier surveynumbers(bytes32 _surveyplan)
    {
       require(SurveyPlans[_surveyplan], 'Duplicate Survey Plan Number');
        _;
    }

    modifier checksurveynumbers(bytes32 _surveyplan)
    {
       require(!SurveyPlans[_surveyplan], 'Survey Plan Number Already used or Invalid');
        _;
    }

    //Events

    //Add Survey Plans
    function addSurveyPlans(
        bytes32 _surveyplan
        //address _planOwner
        ) public onlyOwner surveynumbers(_surveyplan) returns(bool) {
        SurveyPlans[_surveyplan] = true;
        _SurveyPlans.push(_surveyplan);
        count++;
    }

    //Mark survey plan as used
    // function SurveyPlanUsed(
    //     bytes32 _surveyplan
    // ) internal onlyOwner returns(bool){
    //     SurveyPlans[_surveyplan] = false;
    // }

    //Get Survey Plan number user registry address
    function GetSurveyPlanOwner(
        bytes32 _surveyplan
    ) public view returns(address){
        return SurveyPlanOwner[_surveyplan];
    }

    //adding registrars
    function registrarReg(
        address _RegistryID,
        string memory _RegistryName,
        string memory _RegistryAddress,
        string memory _State,
        string memory _AddedBy
    ) public returns(bool) {
        registry[_RegistryID] = registryDetails(_RegistryID, _RegistryName, _RegistryAddress, _State, _AddedBy);
        return true;
    }

    //adding administrators
    function addSuperAdmin(
        address _superAdmin,
        string memory _registrar
        ) public onlyOwner {
        superAdmin[_registrar] = _superAdmin;
    }

    function bioDataReg(
        address _OwnerAddr,
        string memory _FamilyName,
        string memory _FamilyRep,
        string memory _FamilyRep_HouseAddress,
        string memory _FamilyRep_Mobile_No,
        uint32 _BVN
    ) public checkRegistrar(_msgSender())
    returns(address, LandRegistry)
    {
        LandRegistry _bioRegistry = new LandRegistry(
            _OwnerAddr,
            _FamilyName,
            _FamilyRep,
            _FamilyRep_HouseAddress,
            _FamilyRep_Mobile_No,
            _BVN);
        property[_OwnerAddr].assets.push(_bioRegistry);
            return (_OwnerAddr, _bioRegistry);
    }

    //Registration of land details.
    function landRegistration(
        address _OwnerAddr,
        uint32 _Assetid,
        address _regAddr,
        bytes32[11] memory arrayForLand,
        reqStatus _StatusOfLand
        ) public
        checkRegistrar(_msgSender())
        checksurveynumbers(arrayForLand[6])
        returns(bool) {
        LandRegistry bioreg = property[_OwnerAddr].assets[_Assetid];
        bool registry = bioreg.SaveLandDetail(
             _OwnerAddr,
            _regAddr,
            arrayForLand,
            _StatusOfLand
            );
            SurveyPlans[arrayForLand[6]] = false;
            SurveyPlanOwner[arrayForLand[6]] = _regAddr;

        return registry;
    }

    //return registry contract addresses of user
    function ownerRegistryAddr(address _addr)
        public view returns(LandRegistry[] memory ){
            LandRegistry[] memory regbyte = property[_addr].assets;
            return regbyte;
        }

    //to view family details of land
    function landInfoOwner(
        address _OwnerAddr,
        uint32 _Assetid
        ) public view
        returns(
            address,
            string memory,
            string memory,
            string memory,
            string memory,
            uint32
        )
        {
        LandRegistry landOwnerReg = property[_OwnerAddr].assets[_Assetid];
        return landOwnerReg.FamilyDetails();
    }

    //to view family details of land
    function landInfo(
        address _OwnerAddr,
        uint32 _Assetid
        ) public view
        returns(
            address,
            address,
            bytes32[11] memory,
            reqStatus
        )
        {
        LandRegistry landInfoReg = property[_OwnerAddr].assets[_Assetid];
        return landInfoReg.RegistryDetails();
    }

    //to view details of land for the buyer
    // function landInfoUser(
    //     uint id
    //     ) public view returns(
    //     address,
    //     uint,
    //     bool,
    //     address,
    //     ExternalStorage.reqStatus)
    //     {
    // return(
    //     _LandRegistry[_msgSender()].land[id].CurrentOwner,
    //     _LandRegistry[_msgSender()].land[id].marketValue,
    //     _LandRegistry[_msgSender()].land[id].isAvailable,
    //     _LandRegistry[_msgSender()].land[id].requester,
    //     _LandRegistry[_msgSender()].land[id].requestStatus);
    // }

    // // to compute id for a land.
    // function computeId(string memory _state,string memory _district,string memory _village,uint _surveyNumber) public view returns(uint){
    //     return uint(keccak256(abi.encodePacked(_state,_district,_village,_surveyNumber)))%10000000000000;
    // }

    // //push a request to the land owner
    // function requstToLandOwner(uint id) public {
    //     require(_LandRegistry[_msgSender()].land[id].isAvailable);
    //     _LandRegistry[_msgSender()].land[id].requester=msg.sender;
    //     _LandRegistry[_msgSender()].land[id].isAvailable=false;
    //     _LandRegistry[_msgSender()].land[id].requestStatus = reqStatus.pending; //changes the status to pending.
    // }

    // //will show assets of the function caller
    // function viewAssets()public view returns(uint[] memory){
    //     return (profile[msg.sender].assetList);
    // }

    // //viewing request for the lands
    // function viewRequest(uint property)public view returns(address){
    //     return(_LandRegistry[_msgSender()].land[property].requester);
    // }

    // //processing request for the land by accepting or rejecting
    // function processRequest(uint property,reqStatus status)public {
    //     require(_LandRegistry[_msgSender()].land[property].CurrentOwner == _msgSender());
    //     _LandRegistry[_msgSender()].land[property].requestStatus=status;
    //     if(status == reqStatus.reject){
    //         _LandRegistry[_msgSender()].land[property].requester = address(0);
    //         _LandRegistry[_msgSender()].land[property].requestStatus = reqStatus.Default;
    //     }
    // }

    // //availing land for sale.
    // function makeAvailable(uint property)public{
    //     require(_LandRegistry[_msgSender()].land[property].CurrentOwner == _msgSender());
    //     _LandRegistry[_msgSender()].land[property].isAvailable=true;
    // }

    // //buying the approved property
    // function buyProperty(uint property)public payable{
    //     require(_LandRegistry[_msgSender()].land[property].requestStatus == reqStatus.approved);
    //     require(_msgSender().value >= (_LandRegistry[_msgSender()].land[property].marketValue+((_LandRegistry[_msgSender()].land[property].marketValue)/10)));
    //     _LandRegistry[_msgSender()].land[property].CurrentOwner.transfer(_LandRegistry[_msgSender()].land[property].marketValue);
    //     removeOwnership(_LandRegistry[_msgSender()].land[property].CurrentOwner,property);
    //     _LandRegistry[_msgSender()].land[property].CurrentOwner=msg.sender;
    //     _LandRegistry[_msgSender()].land[property].isAvailable=false;
    //     _LandRegistry[_msgSender()].land[property].requester = address(0);
    //     _LandRegistry[_msgSender()].land[property].requestStatus = reqStatus.Default;
    //     profile[msg.sender].assetList.push(property); //adds the property to the asset list of the new owner.
    // }

    // //removing the ownership of seller for the land. and it is called by the buyProperty function
    // function removeOwnership(address previousOwner,uint id)private{
    //     uint index = findId(id,previousOwner);
    //     profile[previousOwner].assetList[index]=profile[previousOwner].assetList[profile[previousOwner].assetList.length-1];
    //     delete profile[previousOwner].assetList[profile[previousOwner].assetList.length-1];
    //     profile[previousOwner].assetList.length--;
    // }

    //for finding the index of a perticular id
    // function findId(uint id,address user)public view returns(uint){
    //     uint i;
    //     for(i=0;i<profile[user].assetList.length;i++){
    //         if(profile[user].assetList[i] == id)
    //             return i;
    //     }
    //     return i;
    // }

}