pragma solidity ^0.5.0;

import "./Ownable.sol";

/**
 * @dev Contract module which provides a basic storage system.
 *
 * This module is used through inheritance. It will make available the contract
 * addresses created, owners of the contract and land record detailing land documentations.
 */

contract ExternalStorage is Ownable{

    uint32 count;

    //Types

    //Variables
    address[] public Registry;
    mapping(string => address) superAdmin;
    mapping(address => profiles) profile;
    //mapping(address => properties) property;
    mapping(address => registryDetails) registry;
    mapping(bytes32 => bool) SurveyPlans;
    mapping(bytes32 => address) SurveyPlanOwner;
    bytes32[] public _SurveyPlans;
    bioData public biodataDetails;
    landDetails public land;

    //request status
    enum reqStatus {pending,reject,approved}

    //profile of a client
    struct profiles{
        uint[] assetList;
        }

    //addresses of registered property
    // struct properties{
    //     address[] assets;
    //     }

    //BioData Details
    struct bioData{
        address OwnerAddr;
        string FamilyName;
        string FamilyRep;
        string FamilyRep_HouseAddress;
        string FamilyRep_Mobile_No;
        uint32 BVN;
    }

    //Land Details
    struct landDetails{
        address OwnerAddr;
        address regAddr;
        bytes32 ReferenceCode;
        bytes32 LandDimensions;
        bytes32 Longitude;
        bytes32 Latitude;
        bytes32 MeasuredBy;
        bytes32 Govt_Approval_for_housingNo;
        bytes32 SurveyNumber;
        bytes32 MarketValue;
        bytes32 CurrentOwner;
        bytes32 District;
        bytes32 State;
        reqStatus StatusOfLand;
    }

    //Registry Details
    struct registryDetails{
        address RegistryID;
        string RegistryName;
        string RegistryAddress;
        string State;
        string AddedBy;
    }

 }