
## Changes Found for `test-drift-54` in `plat-ue2-sandbox`

<a href="https://cloudposse.com/"><img src="https://cloudposse.com/logo-300x69.svg" width="100px" align="right"/></a>
[![create](https://shields.io/badge/PLAN-CREATE-success?style=for-the-badge)](#user-content-create-plat-ue2-sandbox-test-drift-54) [![replace](https://shields.io/badge/PLAN-REPLACE-critical?style=for-the-badge)](#user-content-replace-plat-ue2-sandbox-test-drift-54)


### :warning: Resource Deletion will happen :warning:
This plan contains resource delete operation. Please check the plan result very carefully!


<details><summary><a id="result-plat-ue2-sandbox-test-drift-54" />Plan: 8 to add, 0 to change, 5 to destroy.</summary>

<br/>      
To reproduce this locally, run:<br/><br/>

```shell
atmos terraform plan test-drift-54 -s plat-ue2-sandbox
```
    


    
---
### <a id="create-plat-ue2-sandbox-test-drift-54" />Create
```diff
+ module.s3_bucket.aws_s3_bucket_acl.default[0]
+ module.s3_bucket.aws_s3_bucket_lifecycle_configuration.default[0]
+ module.s3_bucket.aws_s3_bucket_ownership_controls.default[0]
```
### <a id="replace-plat-ue2-sandbox-test-drift-54" />Replace
```diff
- module.s3_bucket.aws_s3_bucket.default[0]
+ module.s3_bucket.aws_s3_bucket.default[0]
- module.s3_bucket.aws_s3_bucket_policy.default[0]
+ module.s3_bucket.aws_s3_bucket_policy.default[0]
- module.s3_bucket.aws_s3_bucket_public_access_block.default[0]
+ module.s3_bucket.aws_s3_bucket_public_access_block.default[0]
- module.s3_bucket.aws_s3_bucket_server_side_encryption_configuration.default[0]
+ module.s3_bucket.aws_s3_bucket_server_side_encryption_configuration.default[0]
- module.s3_bucket.aws_s3_bucket_versioning.default[0]
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

  # module.s3_bucket.aws_s3_bucket.default[0] must be replaced
-/+ resource "aws_s3_bucket" "default" {
      + acceleration_status         = (known after apply)
      + acl                         = (known after apply)
      ~ arn                         = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)
      ~ bucket                      = "cptest-plat-ue2-sandbox-test-drift-54-01" -> "cptest-plat-ue2-sandbox-test-drift-54-01-1" # forces replacement
      ~ bucket_domain_name          = "cptest-plat-ue2-sandbox-test-drift-54-01.s3.amazonaws.com" -> (known after apply)
      + bucket_prefix               = (known after apply)
      ~ bucket_regional_domain_name = "cptest-plat-ue2-sandbox-test-drift-54-01.s3.us-east-2.amazonaws.com" -> (known after apply)
      ~ hosted_zone_id              = "Z2O1EMRO9K5GLX" -> (known after apply)
      ~ id                          = "cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)
      ~ policy                      = jsonencode(
            {
              - Statement = [
                  - {
                      - Action    = "s3:PutObject"
                      - Condition = {
                          - StringNotEquals = {
                              - "s3:x-amz-server-side-encryption" = "AES256"
                            }
                        }
                      - Effect    = "Deny"
                      - Principal = "*"
                      - Resource  = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01/*"
                      - Sid       = "DenyIncorrectEncryptionHeader"
                    },
                  - {
                      - Action    = "s3:PutObject"
                      - Condition = {
                          - Null = {
                              - "s3:x-amz-server-side-encryption" = "true"
                            }
                        }
                      - Effect    = "Deny"
                      - Principal = "*"
                      - Resource  = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01/*"
                      - Sid       = "DenyUnEncryptedObjectUploads"
                    },
                  - {
                      - Action    = "s3:*"
                      - Condition = {
                          - Bool = {
                              - "aws:SecureTransport" = "false"
                            }
                        }
                      - Effect    = "Deny"
                      - Principal = "*"
                      - Resource  = [
                          - "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01/*",
                          - "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01",
                        ]
                      - Sid       = "ForceSSLOnlyAccess"
                    },
                ]
              - Version   = "2012-10-17"
            }
        ) -> (known after apply)
      ~ region                      = "us-east-2" -> (known after apply)
      ~ request_payer               = "BucketOwner" -> (known after apply)
      ~ tags                        = {
            "Environment" = "ue2"
          ~ "Name"        = "cptest-plat-ue2-sandbox-test-drift-54-01" -> "cptest-plat-ue2-sandbox-test-drift-54-01-1"
            "Namespace"   = "cptest"
            "Stage"       = "sandbox"
            "Tenant"      = "plat"
        }
      ~ tags_all                    = {
          ~ "Name"        = "cptest-plat-ue2-sandbox-test-drift-54-01" -> "cptest-plat-ue2-sandbox-test-drift-54-01-1"
            # (4 unchanged elements hidden)
        }
      + website_domain              = (known after apply)
      + website_endpoint            = (known after apply)
        # (2 unchanged attributes hidden)

      - grant {
          - id          = "0f27b641ccc0cc42280c1502135109383cb3bfeb452d0aa90309d77b9dcbe05a" -> null
          - permissions = [
              - "FULL_CONTROL",
            ] -> null
          - type        = "CanonicalUser" -> null
        }

      - lifecycle_rule {
          - abort_incomplete_multipart_upload_days = 90 -> null
          - enabled                                = true -> null
          - id                                     = "default" -> null
          - tags                                   = {} -> null

          - transition {
              - days          = 730 -> null
              - storage_class = "GLACIER" -> null
            }
        }

      - server_side_encryption_configuration {
          - rule {
              - bucket_key_enabled = false -> null

              - apply_server_side_encryption_by_default {
                  - sse_algorithm = "AES256" -> null
                }
            }
        }

      - versioning {
          - enabled    = false -> null
          - mfa_delete = false -> null
        }
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

  # module.s3_bucket.aws_s3_bucket_policy.default[0] must be replaced
-/+ resource "aws_s3_bucket_policy" "default" {
      ~ bucket = "cptest-plat-ue2-sandbox-test-drift-54-01" # forces replacement -> (known after apply) # forces replacement
      ~ id     = "cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)
      ~ policy = jsonencode(
            {
              - Statement = [
                  - {
                      - Action    = "s3:PutObject"
                      - Condition = {
                          - StringNotEquals = {
                              - "s3:x-amz-server-side-encryption" = "AES256"
                            }
                        }
                      - Effect    = "Deny"
                      - Principal = "*"
                      - Resource  = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01/*"
                      - Sid       = "DenyIncorrectEncryptionHeader"
                    },
                  - {
                      - Action    = "s3:PutObject"
                      - Condition = {
                          - Null = {
                              - "s3:x-amz-server-side-encryption" = "true"
                            }
                        }
                      - Effect    = "Deny"
                      - Principal = "*"
                      - Resource  = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01/*"
                      - Sid       = "DenyUnEncryptedObjectUploads"
                    },
                  - {
                      - Action    = "s3:*"
                      - Condition = {
                          - Bool = {
                              - "aws:SecureTransport" = "false"
                            }
                        }
                      - Effect    = "Deny"
                      - Principal = "*"
                      - Resource  = [
                          - "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01/*",
                          - "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01",
                        ]
                      - Sid       = "ForceSSLOnlyAccess"
                    },
                ]
              - Version   = "2012-10-17"
            }
        ) -> (known after apply)
    }

  # module.s3_bucket.aws_s3_bucket_public_access_block.default[0] must be replaced
-/+ resource "aws_s3_bucket_public_access_block" "default" {
      ~ bucket                  = "cptest-plat-ue2-sandbox-test-drift-54-01" # forces replacement -> (known after apply) # forces replacement
      ~ id                      = "cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)
        # (4 unchanged attributes hidden)
    }

  # module.s3_bucket.aws_s3_bucket_server_side_encryption_configuration.default[0] must be replaced
-/+ resource "aws_s3_bucket_server_side_encryption_configuration" "default" {
      ~ bucket = "cptest-plat-ue2-sandbox-test-drift-54-01" # forces replacement -> (known after apply) # forces replacement
      ~ id     = "cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)

        # (1 unchanged block hidden)
    }

  # module.s3_bucket.aws_s3_bucket_versioning.default[0] must be replaced
-/+ resource "aws_s3_bucket_versioning" "default" {
      ~ bucket = "cptest-plat-ue2-sandbox-test-drift-54-01" # forces replacement -> (known after apply) # forces replacement
      ~ id     = "cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)

      ~ versioning_configuration {
          + mfa_delete = (known after apply)
            # (1 unchanged attribute hidden)
        }
    }

Plan: 8 to add, 0 to change, 5 to destroy.

Changes to Outputs:
  ~ bucket_arn                  = "arn:aws:s3:::cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)
  ~ bucket_domain_name          = "cptest-plat-ue2-sandbox-test-drift-54-01.s3.amazonaws.com" -> (known after apply)
  ~ bucket_id                   = "cptest-plat-ue2-sandbox-test-drift-54-01" -> (known after apply)
  ~ bucket_region               = "us-east-2" -> (known after apply)
  ~ bucket_regional_domain_name = "cptest-plat-ue2-sandbox-test-drift-54-01.s3.us-east-2.amazonaws.com" -> (known after apply)
```

</details>



      
