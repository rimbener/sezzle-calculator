#!/usr/bin/env bash
set -euo pipefail

# Opens one task's artifact trail for the build: .awc/tasks/spec-ready/<task>/
# becomes .awc/tasks/in-progress/<task>/, tmp/ and all. Run by the
# workflow's first node; the mirror of the spec workflow's handoff.
#
#   open-task.sh <task>
#
# Moving the files (and tidying the then-empty spec-ready/ container) is all
# it does. Silent on success; every failure prints and exits non-zero.

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

ready_dir=".awc/tasks/spec-ready/$task"
in_progress=".awc/tasks/in-progress/$task"

# A resumed run reaching this node a second time already opened the trail.
if [[ ! -d "$ready_dir" ]]; then
  if [[ -d "$in_progress" ]]; then
    exit 0
  fi
  echo "no spec bundle to open: $ready_dir does not exist (run prd-to-spec for $task first)" >&2
  exit 1
fi

if [[ -e "$in_progress" ]]; then
  echo "$in_progress already exists; move or remove it before opening $ready_dir" >&2
  exit 1
fi

for required in spec.md acceptance-criteria.md tmp/subtasks.md; do
  if [[ ! -f "$ready_dir/$required" ]]; then
    echo "$ready_dir is missing $required; the bundle is incomplete" >&2
    exit 1
  fi
done

mkdir -p "$(dirname "$in_progress")"
mv "$ready_dir" "$in_progress"
rmdir .awc/tasks/spec-ready 2>/dev/null || true
