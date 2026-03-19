#import <Cocoa/Cocoa.h>
#import <ApplicationServices/ApplicationServices.h>

extern void onCtrlKeyEvent(int isKeyDown);

static id globalMonitor = nil;
static id localMonitor = nil;

static void handleFlags(NSEvent *event) {
	if (event.keyCode == 0x3B) {
		BOOL isDown = (event.modifierFlags & NSEventModifierFlagControl) != 0;
		onCtrlKeyEvent(isDown ? 1 : 0);
	}
}

void startKeyMonitor(void) {
	dispatch_async(dispatch_get_main_queue(), ^{
		NSDictionary *opts = @{(__bridge id)kAXTrustedCheckOptionPrompt: @NO};
		Boolean trusted = AXIsProcessTrustedWithOptions((__bridge CFDictionaryRef)opts);
		if (!trusted) {
			NSLog(@"[Super Pencil] Accessibility permission not granted – open System Settings > Privacy & Security > Accessibility to allow.");
		}

		globalMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskFlagsChanged
		                                                      handler:^(NSEvent *event) {
			handleFlags(event);
		}];

		localMonitor = [NSEvent addLocalMonitorForEventsMatchingMask:NSEventMaskFlagsChanged
		                                                    handler:^(NSEvent *event) {
			handleFlags(event);
			return event;
		}];
	});
}
