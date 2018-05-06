#!/bin/bash
red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 12`
grey=`tput setaf 8`
reset=`tput sgr0`

read -p "${yellow}New database to host the OnlineJudge [onlinejudge]: ${reset}" database
if [[ -z "$database" ]]; then
   database="onlinejudge"
fi

read -p "${yellow}Add a user for $database [ojadmin]: ${reset}" username
if [[ -z "$username" ]]; then
   username="ojadmin"
fi

read -s -p "${yellow}Set a password for $username []: ${reset}" password
echo
if [[ -z "$password" ]]; then
   echo "${green}Password is empty. So you must set $database to 'trust' in pg_hba.conf ${reset}"
fi

echo "${grey}"
sudo -u postgres createdb -e $database 'Online Judge Database'
sudo -u postgres createuser -esl $username
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$password'"
echo "${reset}"

read -n1 -r -p "${yellow}If the commands above produce no error, press any key to continue.${grey}" key
cat functions.sql structure.sql views.sql triggers.sql initialize.sql | sudo -u postgres psql -d $database -f -

read -n1 -r -p "${yellow}If the commands above produce no error, press any key to continue.${reset}" key
content="module.exports = {  user: '$username',  host: 'localhost',  database: '$database'"
if [[ -z "$password" ]]; then
    echo "${green}Please trust connection from localhost."
else
    content="$content  ,password: '$password'"
fi
content="$content}"

echo $content > ../config/postgres.js

echo "${green}Finished.${reset}"
