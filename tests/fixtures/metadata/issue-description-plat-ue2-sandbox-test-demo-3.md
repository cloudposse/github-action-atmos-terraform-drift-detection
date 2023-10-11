
## Drift Detection Failed for `test-demo-3` in `plat-ue2-sandbox`!



<a href="https://cloudposse.com/"><img src="https://cloudposse.com/logo-300x69.svg" width="100px" align="right"/></a>


[![failed](https://shields.io/badge/PLAN-FAILED-ff0000?style=for-the-badge)](#user-content-result-plat-ue2-sandbox-test-demo-3)





<details><summary><a id="result-plat-ue2-sandbox-test-demo-3" />:warning: Error summary</summary>

<br/>      
To reproduce this locally, run:<br/><br/>

```shell
atmos terraform plan test-demo-3 -s plat-ue2-sandbox
```

---

```hcl
Error: Invalid value for input variable

  on plat-ue2-sandbox-test-demo-3.terraform.tfvars.json line 38:
  38:    "lifecycle_configuration_rules": [
  39:    {
  40:       "abort_incomplete_multipart_upload_days": 90,
  41:       "enabled": true,
  42:       "expiration": {
  43:    
  44: },
  45:       "filter_and": {
  46:    "prefix": "",
  47:    "tags": {
  48:    
  49: }
  50: },
  51:       "id": "default",
  52:       "noncurrent_version_transition": [
  53:    {
  54:       "days": 90,
  55:       "storage_class": "GLACIER"
  56:    }
  57: ],
  58:       "transition": [
  59:    {
  60:       "days": 730,
  61:       "storage_class": "GLACIER"
  62:    }
  63: ]
  64:    }
  65: ],

The given value is not suitable for var.lifecycle_configuration_rules
declared at variables.tf:179,1-41: element 0: attribute
"noncurrent_version_expiration" is required.
exit status 1
```

    


    
</details>


      




<details><summary>Metadata</summary>

```json
{
  "component": "test-demo-3",
  "stack": "plat-ue2-sandbox",
  "componentPath": "components/terraform/s3-bucket",
  "commitSHA": "82710d1ad13aaa9ceb18fe44b040b7dcadbdb7bc"
}
```
</details>


