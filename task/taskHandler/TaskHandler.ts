export interface TaskHandler {
    check(): boolean
    run(): void
    success(): void
    successMessage(): string
    fail(): void
    failMessage(): string

}