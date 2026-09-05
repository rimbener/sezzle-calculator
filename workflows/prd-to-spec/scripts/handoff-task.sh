#!/usr/bin/env bash
set -euo pipefail

# Hands one task's artifact trail to the code workflow:
# .awc/tasks/in-progress/<task>/ becomes .awc/tasks/spec-ready/<task>/, tmp/
# and all. Run by the workflow's last trail-touching node.
#
#   handoff-task.sh <task>
#
# Moving the files (and tidying the then-empty in-progress/ container) is all
# it does — committing the move belongs to the workflow. Silent on success;
# every failure prints and exits non-zero.

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo "usage: $(basename "$0") <task>" >&2
  exit 1
fi

task="$1"

# The task id names a directory under the trail and nothing else — a value
# carrying a slash or a dot segment would move a directory outside it.
if [[ ! "$task" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "task must be an id of letters, digits, hyphens, or underscores: $task" >&2
  exit 1
fi

in_progress=".awc/tasks/in-progress/$task"
ready_dir=".awc/tasks/spec-ready/$task"

# A resumed run reaching this node a second time is already finished.
if [[ ! -d "$in_progress" ]]; then
  if [[ -d "$ready_dir" ]]; then
    exit 0
  fi
  echo "no trail to hand off: $in_progress does not exist" >&2
  exit 1
fi

if [[ -e "$ready_dir" ]]; then
  echo "$ready_dir already exists; move or remove it before handing off $in_progress" >&2
  exit 1
fi

mkdir -p "$(dirname "$ready_dir")"
mv "$in_progress" "$ready_dir"
rmdir .awc/tasks/in-progress 2>/dev/null || true
