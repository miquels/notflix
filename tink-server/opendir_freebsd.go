// +build freebsd

package main

import (
	"os"
	"path"
	"syscall"
	"time"
)

func (fi *FileInfo) Createtime() (t time.Time) {
	if fi.createtime == 0 {
		p := path.Join(fi.dir.name, fi.name)
		s, err := os.Stat(p)
		if err != nil {
			return
		}
		fi.set(s)
		stat, ok := s.Sys().(*syscall.Stat_t)
		if !ok {
			return
		}
		// freebsd...
		fi.createtime = syscall.TimespecToNsec(stat.Ctimespec)
	}
	t = time.Unix(0, fi.createtime)
	return
}
