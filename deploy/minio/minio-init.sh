#!/bin/sh
# Idempotent bucket setup: public read on objects (no listing) and a least-privilege user for the app.
set -eu

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
mc mb --ignore-existing "local/$S3_BUCKET"

cat > /tmp/public-read.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::$S3_BUCKET/*"]
  }]
}
EOF
mc anonymous set-json /tmp/public-read.json "local/$S3_BUCKET"

cat > /tmp/app-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::$S3_BUCKET/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::$S3_BUCKET"]
    }
  ]
}
EOF
mc admin policy create local livon-app /tmp/app-policy.json
mc admin user add local "$S3_ACCESS_KEY" "$S3_SECRET_KEY"
mc admin policy attach local livon-app --user "$S3_ACCESS_KEY" 2>/dev/null || true

echo "MinIO bucket $S3_BUCKET ready"
