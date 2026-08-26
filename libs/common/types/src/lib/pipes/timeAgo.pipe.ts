import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "timeAgo",
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return "";

    const timeAgo = this.getTimeAgo(value);
    return timeAgo;
  }

  // Helper function to calculate time ago
  private getTimeAgo(date: any): string {
    const now = new Date();
    const timeDifference = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  }
}
