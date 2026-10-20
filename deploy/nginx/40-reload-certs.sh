#!/bin/sh
# Picks up certificates renewed by the certbot container.
(while :; do sleep 6h; nginx -s reload; done) &
