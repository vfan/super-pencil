package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa -framework ApplicationServices

extern void startKeyMonitor(void);
*/
import "C"

import (
	"sync"
	"time"
)

var (
	lastCtrlDown time.Time
	ctrlReleased bool
	singleTimer  *time.Timer
	doubleTapCb  func()
	singleTapCb  func()
	hookMu       sync.Mutex
)

//export onCtrlKeyEvent
func onCtrlKeyEvent(isKeyDown C.int) {
	hookMu.Lock()
	defer hookMu.Unlock()

	if isKeyDown == 1 {
		now := time.Now()
		if !lastCtrlDown.IsZero() && now.Sub(lastCtrlDown) < 400*time.Millisecond {
			if singleTimer != nil {
				singleTimer.Stop()
				singleTimer = nil
			}
			if doubleTapCb != nil {
				go doubleTapCb()
			}
			lastCtrlDown = time.Time{}
			ctrlReleased = false
		} else {
			lastCtrlDown = now
			ctrlReleased = false
			if singleTimer != nil {
				singleTimer.Stop()
			}
			singleTimer = time.AfterFunc(400*time.Millisecond, func() {
				hookMu.Lock()
				defer hookMu.Unlock()
				if ctrlReleased && singleTapCb != nil {
					go singleTapCb()
				}
				lastCtrlDown = time.Time{}
				singleTimer = nil
			})
		}
	} else {
		ctrlReleased = true
	}
}

func StartKeyboardHook(onDoubleTap func(), onSingleTap func()) {
	doubleTapCb = onDoubleTap
	singleTapCb = onSingleTap
	C.startKeyMonitor()
}
