call m utils.ver

git add .
git reset backup/*

git commit -m "%*"

git add backup/*
git commit -m "%* backup"
