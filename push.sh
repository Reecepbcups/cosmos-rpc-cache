VERSION="reecepbcups/better-cosmos-rpcs:1.1.2"

echo "Building $VERSION"
sudo docker build -t $VERSION .

echo "Pushing '$VERSION'"
sudo docker image push $VERSION