# github
function gha() {
  GITHUB_TOKEN=$(git config --global --get user.githubToken)
  if [[ -z "$GITHUB_TOKEN" ]]; then
    echo "Error: Configuration parameter 'githubToken' not found in global .gitconfig"
    return 1
  fi

  if [[ -z "$1" ]]; then
    echo "github repo name is required"
    return 1
  fi
  
  API_URL="https://api.github.com/user/repos"
  curl -u ajiu9:$GITHUB_TOKEN -d '{"name":"'$1'"}' $API_URL
}

function record() {
  local startWidth=${2:-0}
  local startHeight=${3:-0}
  dir=~/"screencapture/jpg"
  mkdir -p "$dir"
  
  local SLEEP_TIME=${1:-7}
  DISPLAY_INFO=$(/usr/sbin/system_profiler SPDisplaysDataType | grep -oE '([0-9]+) x ([0-9]+)')
 
  if [[ $DISPLAY_INFO =~ "([0-9]+)\ x\ ([0-9]+)" ]]; then
    IFS=' x ' read -r RES_WIDTH RES_HEIGHT <<< "$DISPLAY_INFO"
  else
    echo "Unable to parse screen resolution from system output."
    return 1
  fi

  local x=$startWidth
  local y=$startHeight 

  while :
    NOW=$(date +"%y%m%d%H%M%S");
  do screencapture -C -R ${x},${y},$((RES_WIDTH/2)),$((RES_HEIGHT/2)) -t jpg -x ~/screencapture/jpg/$NOW.jpg;
    sleep $SLEEP_TIME & pid=$!
    NOW=$(date +"%y%m%d%H%M%S");
    wait $pid
  done
}
