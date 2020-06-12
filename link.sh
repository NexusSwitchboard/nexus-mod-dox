
if [ -z "$1" ]
then
  npm link @nexus-switchboard/nexus-extend || exit
  npm link @nexus-switchboard/nexus-conn-confluence || exit
  npm link @nexus-switchboard/nexus-conn-slack || exit
  npm link @nexus-switchboard/nexus-conn-sendgrid || exit
elif [ "$1" == "reset" ]
then
  rm -rf ./node_modules || exit
  npm i || exit
fi

