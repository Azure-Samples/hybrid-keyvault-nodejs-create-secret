process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var Environment = require("@azure/ms-rest-azure-env");
var msRestNodeAuth = require('@azure/ms-rest-nodeauth');
var KeyVaultManagementClient = require("@azure/arm-keyvault-profile-2019-03-01-hybrid").KeyVaultManagementClient;
var ResourceManagementClient = require('@azure/arm-resources-profile-hybrid-2019-03-01').ResourceManagementClient;

var util = require('util');
const request = require('request');
const requestPromise = util.promisify(request);

// update these
var clientId = "";
var clientObjectId = "";
var clientSecret = "";
var tenantId = ""; //"adfs"
var subscriptionId = "";
var armEndpoint = "";
var location = ""
var resourceGroup = "azs-sample-rg"
var keyVaultName = "azs-sample-kv"
var secretName = "azs-app-created-secret";
var secretValue = "azs-app-created-password";

function fetchEndpointMetadata() {
  // Setting URL and headers for request
  console.log("Fetching environment endpoints");
  var options = {
    "url": armEndpoint + 'metadata/endpoints?api-version=1.0',
    "headers": { "User-Agent": "request" },
    "rejectUnauthorized": false
  };
  // Return new promise 
  return new Promise(function (resolve, reject) {
    // Do async job
    request.get(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
}

function setEnvironment(armEndpointMetadata) {
    console.log(armEndpointMetadata)
    console.log("Setting environment")
    map = {};
    map["name"] = "AzureStack"
    map["portalUrl"] = armEndpointMetadata.portalEndpoint 
    map["resourceManagerEndpointUrl"] = armEndpoint 
    map["galleryEndpointUrl"] = armEndpointMetadata.galleryEndpoint 
    map["activeDirectoryEndpointUrl"] = armEndpointMetadata.authentication.loginEndpoint.slice(0, armEndpointMetadata.authentication.loginEndpoint.lastIndexOf("/") + 1) 
    map["activeDirectoryResourceId"] = armEndpointMetadata.authentication.audiences[0] 
    map["activeDirectoryGraphResourceId"] = armEndpointMetadata.graphEndpoint 
    map["storageEndpointSuffix"] = armEndpoint.substring(armEndpoint.indexOf('.'))  
    map["keyVaultDnsSuffix"] = ".vault" + armEndpoint.substring(armEndpoint.indexOf('.')) 
    map["managementEndpointUrl"] = armEndpointMetadata.authentication.audiences[0] 
    map["validateAuthority"] = false
    Environment.Environment.add(map);

    var isAdfs = armEndpointMetadata.authentication.loginEndpoint.endsWith('adfs')
    if (isAdfs) {
        tenantId = "adfs"
    }

    var options = {};
    options["environment"] = Environment.Environment.AzureStack;
    options["tokenAudience"] = map["activeDirectoryResourceId"];

    return new Promise((resolve, reject) => {
        resolve(options)
    });
}

function loginWithSP(envOptions) {
    return msRestNodeAuth.loginWithServicePrincipalSecret(clientId, clientSecret, tenantId, envOptions);
}

function createResourceGroup(credentials) {
    var clientOptions = { "baseUri": armEndpoint };
    var resourceClient = new ResourceManagementClient(credentials, subscriptionId, clientOptions);
    var parameters = { "location": location };
    // Create sample resource group. 
    console.log("Creating resource group: " + resourceGroup);
    return resourceClient.resourceGroups.createOrUpdate(resourceGroup, parameters);
}

function createKeyVault(credentials) {
    var clientOptions = { "baseUri": armEndpoint };
    var keyVaultClient = new KeyVaultManagementClient(credentials, subscriptionId, clientOptions);
    var parameters = {
        "location": location,
        "properties": {
            "sku": { "name": "standard" },
            "accessPolicies": [
                {
                    "tenantId": tenantId,
                    "objectId": clientObjectId,
                    "permissions": { "secrets": ["all"] }
                }
            ],
            "enabledForDeployment": false,
            "tenantId": tenantId
        },
        tags: {}
    }; 
    console.log("Creating keyvault: " + keyVaultName);  
    // Create the sample key vault using the KV management client.
    return keyVaultClient.vaults.createOrUpdate(resourceGroup, keyVaultName, parameters);
}

function updateSecret(credentials) {
    var clientOptions = { "baseUri": armEndpoint };
    var keyVaultClient = new KeyVaultManagementClient(credentials, subscriptionId, clientOptions);
    var parameters = {
        "properties": {
            "attributes": {},
            "contentType": "",
            "secretUri": "",
            "secretUriWithVersion": "",
            "value": secretValue
        },
        "tags": {}
    };
    console.log("Updating secret: " + secretName);
    keyVaultClient.secrets.createOrUpdate(resourceGroup, keyVaultName, secretName, parameters, function (err, result) {
        if (err) {
            console.log("Error while writing secret");
            console.log(err);
        } else {
            console.log("Secret set successfully");
            console.log(result);
        }
    });
}

fetchEndpointMetadata()
.then(setEnvironment)
.then(loginWithSP)
.then((credentials) => {
    createResourceGroup(credentials)
    .then((result) => {
        console.log(result);
        return createKeyVault(credentials);
    })
    .then((result) => {
        console.log(result);
        updateSecret(credentials);
    })
})