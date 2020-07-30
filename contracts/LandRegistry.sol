pragma solidity ^0.5.0;

import "./ExternalStorage.sol";

/**
 * @dev Land Registry Contract module.
 *
 * This module is used to create instance of registry contract.
 */

contract LandRegistry is ExternalStorage {

    constructor(
        address _OwnerAddr,
        string memory _FamilyName,
        string memory _FamilyRep,
        string memory _FamilyRep_HouseAddress,
        string memory _FamilyRep_Mobile_No,
        uint32 _BVN
    )public {
        biodataDetails.OwnerAddr = _OwnerAddr;
        biodataDetails.FamilyName = _FamilyName;
        biodataDetails.FamilyRep = _FamilyRep;
        biodataDetails.FamilyRep_HouseAddress = _FamilyRep_HouseAddress;
        biodataDetails.FamilyRep_Mobile_No = _FamilyRep_Mobile_No;
        biodataDetails.BVN = _BVN;
    }


    function SaveLandDetail(
        address _OwnerAddr,
        address _regAddr,
        bytes32[11] memory ArrayForLand,
        reqStatus _StatusOfLand
    ) public returns(bool)
    {
        bytes32 _ReferenceCode = ArrayForLand[0];
        bytes32 _LandDimensions = ArrayForLand[1];
        bytes32 _Longitude = ArrayForLand[2];
        bytes32 _Latitude = ArrayForLand[3];
        bytes32 _MeasuredBy = ArrayForLand[4];
        bytes32 _Govt_Approval_for_housingNo = ArrayForLand[5];
        bytes32 _SurveyNumber = ArrayForLand[6];
        bytes32 _MarketValue = ArrayForLand[7];
        bytes32 _CurrentOwner = ArrayForLand[8];
        bytes32 _District = ArrayForLand[9];
        bytes32 _State = ArrayForLand[10];
        land.OwnerAddr = _OwnerAddr;
        land.regAddr = _regAddr;
        land.ReferenceCode = _ReferenceCode;
        land.LandDimensions = _LandDimensions;
        land.Longitude = _Longitude;
        land.Latitude = _Latitude;
        land.MeasuredBy = _MeasuredBy;
        land.Govt_Approval_for_housingNo = _Govt_Approval_for_housingNo;
        land.SurveyNumber = _SurveyNumber;
        land.MarketValue = _MarketValue;
        land.CurrentOwner = _CurrentOwner;
        land.District = _District;
        land.State = _State;
        land.StatusOfLand = _StatusOfLand;
        return true;
    }

    function FamilyDetails()
        public view returns(
            address,
            string memory,
            string memory,
            string memory,
            string memory,
            uint32
        )
    {
        return (
            biodataDetails.OwnerAddr,
            biodataDetails.FamilyName,
            biodataDetails.FamilyRep,
            biodataDetails.FamilyRep_HouseAddress,
            biodataDetails.FamilyRep_Mobile_No,
            biodataDetails.BVN
        );
    }

    function RegistryDetails()
        external view returns(
            address,
            address,
            bytes32[11] memory,
            reqStatus
            ) {
            bytes32[11] memory rDetails = [
                land.ReferenceCode,
                land.LandDimensions,
                land.Longitude,
                land.Latitude,
                land.MeasuredBy,
                land.Govt_Approval_for_housingNo,
                land.SurveyNumber,
                land.MarketValue,
                land.CurrentOwner,
                land.District,
                land.State
            ];

        return (
            land.OwnerAddr,
            land.regAddr,
            rDetails,
            land.StatusOfLand
            );
    }

}