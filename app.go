package main

import (
	"context"
	"sync"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx         context.Context
	drawingMode bool
	mu          sync.Mutex
}

func NewApp() *App {
	return &App{drawingMode: true}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	StartKeyboardHook(
		func() { a.ToggleMode() },
		func() { a.ClearScreen() },
	)
}

func (a *App) ToggleMode() {
	a.mu.Lock()
	a.drawingMode = !a.drawingMode
	mode := a.drawingMode
	a.mu.Unlock()

	SetClickThrough(!mode)
	wailsRuntime.EventsEmit(a.ctx, "mode:changed", mode)
}

func (a *App) ClearScreen() {
	a.mu.Lock()
	mode := a.drawingMode
	a.mu.Unlock()

	if mode {
		wailsRuntime.EventsEmit(a.ctx, "clear", true)
	}
}
