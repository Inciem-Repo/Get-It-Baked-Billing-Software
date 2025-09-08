import crypto from "crypto";

export function md5(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}
