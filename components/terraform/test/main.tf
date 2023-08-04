variable "seed" {
  type    = string
  default = "foo"
}

resource "random_id" "this" {
  keepers = {
    # Generate a new id each time we switch to a new seed
    seed = "${var.seed}"
  }
  byte_length = 8
}
