alias gps="git push"
alias gpl="git pull"
alias gt="git status -sb"
alias ga="git add ."
alias gc="git commit -av"
alias gcr="git checkout master && git fetch && git rebase"
alias gclean="git reset --hard && git clean -df"
alias grebase="git fetch && git rebase -i"
alias glg="git log --pretty='%C(red)%h%Creset%C(yellow)%d%Creset %s %C(cyan)(%ar)%Creset'"
alias gdel="git branch --merged master | egrep -v '(\*|master|release|bug$|dev)' | xargs -n 1 -r git branch -d"
alias gck="git checkout"

function gb() {
  if [[ -n $2 ]]; then
    echo `git checkout "$1" && git pull && git checkout -b "$2"`
  else
    case $1 in
      "bug")
        prefix="bugfix"
        ;;
      "release")
        prefix="feature"
        ;;
      *)
        echo "Invalid argument."
        return 1
        ;;
    esac
    current_date=$(date "+%Y-%m-%d")
    branch_name="${prefix}/${current_date}"
    echo `git checkout "$1" && git pull && git checkout -b "$branch_name"`
  fi
  return 0
}

function gbc() {
  RED='\033[31m'
  YELLOW='\033[33m'
  CYAN='\033[36m'
  RESET='\033[0m'

  function get_branch_info() {
    local branch=$1
    local commit_hash=$(git log -1 --pretty="%h" "$branch" 2>/dev/null)
    local branch_info=$(git log -1 --pretty="%d" "$branch" 2>/dev/null)
    local last_commit=$(git log -1 --pretty="%s" "$branch" 2>/dev/null)
    local commit_time_ar=$(git log -1 --pretty="(%ar)" "$branch" 2>/dev/null)
    local commit_time=$(git log -1 --pretty="%ct" "$branch" 2>/dev/null)
    echo "$commit_time|$branch|$commit_hash|$branch_info|$last_commit|$commit_time_ar"
  }

  # Initialize flags
  local all_flag=false
  local sort_flag=false

  # Parse arguments
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      --all)
        all_flag=true
        ;;
      --s)
        sort_flag=true
        ;;
      *)
        echo "Unknown parameter passed: $1"
        return 1
        ;;
    esac
    shift
  done

  if [[ "$sort_flag" == true ]]; then
    branches_info=()
    for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/ 2>/dev/null); do
      if [[ "$all_flag" == false && ("$branch" == "master" || "$branch" == "dev" || "$branch" == "release" || "$branch" == *"bug") ]]; then
        continue
      fi
      branches_info+=("$(get_branch_info "$branch")")
    done

    sorted_branches=$(printf "%s\n" "${branches_info[@]}" | sort -nr -t '|' -k1)

    echo -e "${YELLOW}Branch Name          Last Commit${RESET}"
    while IFS='|' read -r commit_time branch commit_hash branch_info last_commit commit_time_ar; do
      formatted_branch=$(printf "%-20s" "$branch")
      formatted_line=$(printf "%-80s" "$commit_hash $branch_info $last_commit $commit_time_ar")
      echo -e "${CYAN}${formatted_branch}${RESET} ${RED}${commit_hash}${RESET} ${YELLOW}${branch_info}${RESET} ${last_commit} ${CYAN}${commit_time_ar}${RESET}"
    done <<< "$sorted_branches"
  else
    echo -e "${YELLOW}Branch Name          Last Commit${RESET}"
    for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/ 2>/dev/null); do
      if [[ "$all_flag" == false && ("$branch" == "master" || "$branch" == "dev" || "$branch" == "release" || "$branch" == *"bug") ]]; then
        continue
      fi
      commit_hash=$(git log -1 --pretty="%h" "$branch" 2>/dev/null)
      branch_info=$(git log -1 --pretty="%d" "$branch" 2>/dev/null)
      last_commit=$(git log -1 --pretty="%s (%ar)" "$branch" 2>/dev/null)
      formatted_line=$(printf "%-20s %-80s" "$branch" "$commit_hash $branch_info $last_commit")
      echo -e "${CYAN}${formatted_line:0:20}${RESET} ${RED}${commit_hash}${RESET} ${YELLOW}${branch_info}${RESET} ${last_commit}"
    done
  fi
}

# git merge current branch to dev/release/master...
function gm() {
  if [[ -z $1 ]]; then
    echo "Error: target name is required"
    return 1
  fi
  # get current branch name called current_branch
  # check if $1 called target_branch
  # git pull target_branch
  # merge current branch to target branch
  # push the merge to remote

  current_branch=$(git rev-parse --abbrev-ref HEAD)
  echo $current_branch
  echo `git checkout $1 && git pull && git merge $current_branch && git push && git checkout $current_branch`
}

function grandom() {
  # 获取当前日期
  current_date=$(date "+%Y-%m-%d")
  # 生成4个随机数字
  random_number=$(( RANDOM % 676 ))
  # 将随机数转换为A-Z随机字符
  random_chars=""
  for (( i=0; i<4; i++)); do
      random_char_index=$(( RANDOM % 26 ))
      random_char=$(printf \\$(printf '%03o' $((65 + random_char_index))))
      random_chars="${random_chars}${random_char}"
  done
  # 格式化为指定格式的字符串
  formatted_string="${current_date}-${random_chars}"
  formatted_stringOrigin="${arg1}/ajiu9-${formatted_string}"
  if [[ -n $1 ]]; then
    echo `git checkout -b "$1/ajiu9-$formatted_string"`
  else
    `git checkout -b "ajiu9-$formatted_string"`
  fi
}

function giget() {
    if [[ $# -ne 2 ]]; then
        echo "Usage: giget <github-repo> <destination-dir>"
        return 1
    fi

    local repo=$1
    local dir=$2

    # Create the destination directory if it does not exist
    mkdir -p "$dir"

    # Convert GitHub repo shorthand to full URL
    local repo_url="https://github.com/${repo#gh:}"

    # Clone the repository into a temporary directory
    local temp_dir=$(mktemp -d)
    git clone "$repo_url" "$temp_dir"

    if [[ $? -ne 0 ]]; then
        echo "Failed to clone repository from $repo_url"
        rm -rf "$temp_dir"
        return 1
    fi

    # Create a tarball excluding .git directory
    tar --exclude='.git' -czf /tmp/repo.tar.gz -C "$temp_dir" .

    # Extract the tarball into the destination directory
    tar -xzf /tmp/repo.tar.gz -C "$dir"

    # Clean up
    rm -rf "$temp_dir"
    rm /tmp/repo.tar.gz

    echo "Repository cloned to $dir"
}
