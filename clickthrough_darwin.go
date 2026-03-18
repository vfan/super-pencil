package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa

#import <Cocoa/Cocoa.h>

void setClickThrough(int enabled) {
	dispatch_async(dispatch_get_main_queue(), ^{
		NSApplication *app = [NSApplication sharedApplication];
		NSArray *windows = [app windows];
		for (NSWindow *w in windows) {
			[w setIgnoresMouseEvents:(enabled != 0)];
		}
		if (!enabled) {
			[app activateIgnoringOtherApps:YES];
			for (NSWindow *w in windows) {
				[w makeKeyAndOrderFront:nil];
			}
		}
	});
}
*/
import "C"

func SetClickThrough(enabled bool) {
	if enabled {
		C.setClickThrough(1)
	} else {
		C.setClickThrough(0)
	}
}
