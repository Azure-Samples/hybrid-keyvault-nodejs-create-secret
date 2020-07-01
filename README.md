---
Topic: sample
Languages: Node.js
Products: azure-sdks
Services: Azure Stack Hub
---

# Official Microsoft Sample

<!-- 
Guidelines on README format: https://review.docs.microsoft.com/help/onboard/admin/samples/concepts/readme-template?branch=master

Guidance on onboarding samples to docs.microsoft.com/samples: https://review.docs.microsoft.com/help/onboard/admin/samples/process/onboarding?branch=master

Taxonomies for products and languages: https://review.docs.microsoft.com/new-hope/information-architecture/metadata/taxonomies?branch=master
-->

A sample code to create or update keyvault and create or update secret in a keyvault

## Contents

| File/folder       | Description                                |
|-------------------|--------------------------------------------|
| `index.js`        | Sample source code.                        |
| `.gitignore`      | Define what to ignore at commit time.      |
| `package.json`    | Define dependencies.                       |
| `README.md`       | This README file.                          |
| `LICENSE`         | The license for the sample.                |

## Prerequisites

Refer to this azure stack doc for prerequisites (link)[https://docs.microsoft.com/en-us/azure-stack/user/azure-stack-version-profile-nodejs].

## Setup

Set following environment variables:
| Variable              | Description                                                 |
|-----------------------|-------------------------------------------------------------|
| `CLIENT_APP_ID`       | Service principal application id                            |
| `CLIENT_OBJECT_ID`    | Service principal object id                                 |
| `CLIENT_SECRET`       | Service principal application secret                        |
| `TENANT_ID`           | Azure Stack Hub tenant ID                                   |
| `SUBSCRIPTION_ID`     | Subscription id used to access offers in Azure Stack Hub    |
| `ARM_ENDPOINT`        | Azure Stack Hub Resource Manager Endpoint                   |
| `LOCATION`            | Resource location                                           |

Service principal example:

AAD
```
Secret                : System.Security.SecureString                                 # CLIENT_SECRET
ServicePrincipalNames : {bd6bb75f-5fd6-4db9-91b7-4a6941e7feb9, http://azs-sptest01}
ApplicationId         : bd6bb75f-5fd6-4db9-91b7-4a6941e7feb9                         # CLIENT_APP_ID
DisplayName           : azs-sptest01
Id                    : 36a22ee4-e2b0-411d-8f21-0ea8b4b5c46f                         # CLIENT_OBJECT_ID
AdfsId                : 
Type                  : ServicePrincipal
```

ADFS
```
ApplicationIdentifier : S-1-5-21-2937821301-3551617933-4294865508-76632              # CLIENT_OBJECT_ID
ClientId              : 7591924e-0341-4812-8d23-52ef0aa27eff                         # CLIENT_APP_ID                   
Thumbprint            : 
ApplicationName       : Azurestack-azs-sptest01
ClientSecret          : <Redacted>                                                   # CLIENT_SECRET
PSComputerName        : <Redacted>
RunspaceId            : e841cbbc-3d8e-45fd-b63f-42adbfbf664b
```

## Running the sample

From root folder
```
npm install
node .\index.js
```

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
