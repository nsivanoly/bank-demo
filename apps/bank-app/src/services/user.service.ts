export class UserService {
  private static adjectives = ['Happy', 'Sleepy', 'Grumpy', 'Dopey', 'Sneaky', 'Jolly', 'Crazy', 'Mysterious'];
  private static nouns = ['Cat', 'Dog', 'Panda', 'Tiger', 'Fox', 'Bear', 'Wolf', 'Dragon'];

  static getRandomName(): string {
    const randomAdj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const randomNoun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${randomAdj}${randomNoun}${randomNum}`;
  }

  static getDisplayName(authName?: string): string {
    return authName || this.getRandomName();
  }
}
