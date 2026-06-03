export class LoginWithGoogleCommand {
  constructor(
    public readonly googleId: string,
    public readonly email: string,
    public readonly name?: string,
  ) {}
}
