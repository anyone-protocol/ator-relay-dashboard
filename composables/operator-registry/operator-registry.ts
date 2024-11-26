export class OperatorRegistry {
  async claim(): Promise<{ messageId: string } | null> {
    throw new Error('claim() is not yet implemented!');
  }

  async renounce(): Promise<{ messageId: string } | null> {
    throw new Error('renounce() is not yet implemented!');
  }
}
