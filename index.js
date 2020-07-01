// uncomment to ignore 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' error
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

var Environment = require("@azure/ms-rest-azure-env");
var msRestNodeAuth = require('@azure/ms-rest-nodeauth');
var KeyVaultManagementClient = require("@azure/arm-keyvault-profile-2019-03-01-hybrid").KeyVaultManagementClient;
var ResourceManagementClient = require('@azure/arm-resources-profile-hybrid-2019-03-01').ResourceManagementClient;

var util = require('util');
const request = require('request');
const requestPromise = util.promisify(request);

// update these
validateEnvironmentVariables();
var clientAppId = process.env['CLIENT_APP_ID'];
var clientObjectId = process.env['CLIENT_OBJECT_ID'];
var clientSecret = process.env['CLIENT_SECRET'];
var tenantId = process.env['TENANT_ID'];
var subscriptionId = process.env['SUBSCRIPTION_ID'];
var armEndpoint = process.env['ARM_ENDPOINT'];
var location = process.env['LOCATION'];
var domain = tenantId;
var resourceGroup = "azs-sample-rg";
var keyVaultName = "azs-sample-kv";
var secretName = "azs-app-created-secret";
var secretValue = "azs-app-created-password";

function validateEnvironmentVariables() {
    var envs = [];
    if (!process.env['CLIENT_APP_ID']) envs.push('CLIENT_APP_ID');
    if (!process.env['CLIENT_OBJECT_ID']) envs.push('CLIENT_OBJECT_ID');
    if (!process.env['CLIENT_SECRET']) envs.push('CLIENT_SECRET');
    if (!process.env['TENANT_ID']) envs.push('TENANT_ID');
    if (!process.env['SUBSCRIPTION_ID']) envs.push('SUBSCRIPTION_ID');
    if (!process.env['ARM_ENDPOINT']) envs.push('ARM_ENDPOINT');
    if (!process.env['LOCATION']) envs.push('LOCATION');
    if (envs.length > 0) {
        throw new Error(util.format('please set/export the following environment variables: %s', envs.toString()));
    }
}

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
    Environment.Environment.add(map);

    var options = {};
    options["environment"] = Environment.Environment.AzureStack;
    options["tokenAudience"] = map["activeDirectoryResourceId"];

    var isAdfs = armEndpointMetadata.authentication.loginEndpoint.endsWith('adfs')
    if (isAdfs) {
        domain = 'adfs'
        options.environment.validateAuthority = false
    }

    return new Promise((resolve, reject) => {
        resolve(options)
    });
}

function loginWithSP(envOptions) {
    return msRestNodeAuth.loginWithServicePrincipalSecret(clientAppId, clientSecret, domain, envOptions);
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