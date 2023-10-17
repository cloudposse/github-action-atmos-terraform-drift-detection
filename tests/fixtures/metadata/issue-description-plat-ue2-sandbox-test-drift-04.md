
## Drift Detected for `test-drift-04` in `plat-ue2-sandbox`



<a href="https://cloudposse.com/"><img src="https://cloudposse.com/logo-300x69.svg" width="100px" align="right"/></a>

[![create](https://shields.io/badge/PLAN-CREATE-success?style=for-the-badge)](#user-content-create-plat-ue2-sandbox-test-drift-04)





<details><summary><a id="result-plat-ue2-sandbox-test-drift-04" />Plan: 8 to add, 0 to change, 0 to destroy.</summary>

<br/>      
To reproduce this locally, run:<br/><br/>

```shell
atmos terraform plan test-drift-04 -s plat-ue2-sandbox
```
    


    
---
### <a id="create-plat-ue2-sandbox-test-drift-04" />Create
```diff
+ module.s3_bucket.aws_s3_bucket.default[0]
+ module.s3_bucket.aws_s3_bucket_acl.default[0]
+ module.s3_bucket.aws_s3_bucket_lifecycle_configuration.default[0]
+ module.s3_bucket.aws_s3_bucket_ownership_controls.default[0]
+ module.s3_bucket.aws_s3_bucket_policy.default[0]
+ module.s3_bucket.aws_s3_bucket_public_access_block.default[0]
+ module.s3_bucket.aws_s3_bucket_server_side_encryption_configuration.default[0]
+ module.s3_bucket.aws_s3_bucket_versioning.default[0]
```
    
</details>


<details><summary>Terraform <strong>Plan</strong> Summary</summary>

```hcl

  # module.s3_bucket.data.aws_iam_policy_document.aggregated_policy[0] will be read during apply
  # (config refers to values not yet known)
 <= data "aws_iam_policy_document" "aggregated_policy" {
      + id                        = (known after apply)
      + json                      = (known after apply)
      + override_policy_documents = [
          + jsonencode(
                {
                  + Version = "2012-10-17"
                }
            ),
        ]
      + source_policy_documents   = [
          + (known after apply),
        ]
    }

  # module.s3_bucket.data.aws_iam_policy_document.bucket_policy[0] will be read during apply
  # (config refers to values not yet known)
 <= data "aws_iam_policy_document" "bucket_policy" {
      + id   = (known after apply)
      + json = (known after apply)

      + statement {
          + actions   = [
              + "s3:PutObject",
            ]
          + effect    = "Deny"
          + resources = [
              + (known after apply),
            ]
          + sid       = "DenyIncorrectEncryptionHeader"

          + condition {
              + test     = "StringNotEquals"
              + values   = [
                  + "AES256",
                ]
              + variable = "s3:x-amz-server-side-encryption"
            }

          + principals {
              + identifiers = [
                  + "*",
                ]
              + type        = "*"
            }
        }
      + statement {
          + actions   = [
              + "s3:PutObject",
            ]
          + effect    = "Deny"
          + resources = [
              + (known after apply),
            ]
          + sid       = "DenyUnEncryptedObjectUploads"

          + condition {
              + test     = "Null"
              + values   = [
                  + "true",
                ]
              + variable = "s3:x-amz-server-side-encryption"
            }

          + principals {
              + identifiers = [
                  + "*",
                ]
              + type        = "*"
            }
        }
      + statement {
          + actions   = [
              + "s3:*",
            ]
          + effect    = "Deny"
          + resources = [
              + (known after apply),
              + (known after apply),
            ]
          + sid       = "ForceSSLOnlyAccess"

          + condition {
              + test     = "Bool"
              + values   = [
                  + "false",
                ]
              + variable = "aws:SecureTransport"
            }

          + principals {
              + identifiers = [
                  + "*",
                ]
              + type        = "*"
            }
        }
    }

  # module.s3_bucket.aws_s3_bucket.default[0] will be created
  + resource "aws_s3_bucket" "default" {
      + acceleration_status         = (known after apply)
      + acl                         = (known after apply)
      + arn                         = (known after apply)
      + bucket                      = "cptest-plat-ue2-sandbox-test-drift-04-19"
      + bucket_domain_name          = (known after apply)
      + bucket_prefix               = (known after apply)
      + bucket_regional_domain_name = (known after apply)
      + force_destroy               = false
      + hosted_zone_id              = (known after apply)
      + id                          = (known after apply)
      + object_lock_enabled         = false
      + policy                      = (known after apply)
      + region                      = (known after apply)
      + request_payer               = (known after apply)
      + tags                        = {
          + "Environment" = "ue2"
          + "Name"        = "cptest-plat-ue2-sandbox-test-drift-04-19"
          + "Namespace"   = "cptest"
          + "Stage"       = "sandbox"
          + "Tenant"      = "plat"
        }
      + tags_all                    = {
          + "Environment" = "ue2"
          + "Name"        = "cptest-plat-ue2-sandbox-test-drift-04-19"
          + "Namespace"   = "cptest"
          + "Stage"       = "sandbox"
          + "Tenant"      = "plat"
        }
      + website_domain              = (known after apply)
      + website_endpoint            = (known after apply)
    }

  # module.s3_bucket.aws_s3_bucket_acl.default[0] will be created
  + resource "aws_s3_bucket_acl" "default" {
      + acl    = "private"
      + bucket = (known after apply)
      + id     = (known after apply)
    }

  # module.s3_bucket.aws_s3_bucket_lifecycle_configuration.default[0] will be created
  + resource "aws_s3_bucket_lifecycle_configuration" "default" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + rule {
          + id     = "default"
          + status = "Enabled"

          + abort_incomplete_multipart_upload {
              + days_after_initiation = 90
            }

          + filter {
            }

          + transition {
              + days          = 730
              + storage_class = "GLACIER"
            }
        }
    }

  # module.s3_bucket.aws_s3_bucket_ownership_controls.default[0] will be created
  + resource "aws_s3_bucket_ownership_controls" "default" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + rule {
          + object_ownership = "ObjectWriter"
        }
    }

  # module.s3_bucket.aws_s3_bucket_policy.default[0] will be created
  + resource "aws_s3_bucket_policy" "default" {
      + bucket = (known after apply)
      + id     = (known after apply)
      + policy = (known after apply)
    }

  # module.s3_bucket.aws_s3_bucket_public_access_block.default[0] will be created
  + resource "aws_s3_bucket_public_access_block" "default" {
      + block_public_acls       = true
      + block_public_policy     = true
      + bucket                  = (known after apply)
      + id                      = (known after apply)
      + ignore_public_acls      = true
      + restrict_public_buckets = true
    }

  # module.s3_bucket.aws_s3_bucket_server_side_encryption_configuration.default[0] will be created
  + resource "aws_s3_bucket_server_side_encryption_configuration" "default" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + rule {
          + bucket_key_enabled = false

          + apply_server_side_encryption_by_default {
              + sse_algorithm = "AES256"
            }
        }
    }

  # module.s3_bucket.aws_s3_bucket_versioning.default[0] will be created
  + resource "aws_s3_bucket_versioning" "default" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + versioning_configuration {
          + mfa_delete = (known after apply)
          + status     = "Suspended"
        }
    }

Plan: 8 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  ~ bucket_arn                  = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-04-17" -> (known after apply)
  ~ bucket_domain_name          = "cptest-plat-ue2-sandbox-test-drift-04-17.s3.amazonaws.com" -> (known after apply)
  ~ bucket_id                   = "cptest-plat-ue2-sandbox-test-drift-04-17" -> (known after apply)
  ~ bucket_region               = "us-east-2" -> (known after apply)
  ~ bucket_regional_domain_name = "cptest-plat-ue2-sandbox-test-drift-04-17.s3.us-east-2.amazonaws.com" -> (known after apply)
```

</details>
      




<details><summary>Metadata</summary>

```json
{
  "component": "test-drift-04",
  "stack": "plat-ue2-sandbox",
  "componentPath": "components/terraform/s3-bucket",
  "commitSHA": "82710d1ad13aaa9ceb18fe44b040b7dcadbdb7bc"
}
```
</details>


