import { Pipe, type PipeTransform } from "@angular/core";

@Pipe({
  name: "dateFormat",
})
export class DateFormatPipe implements PipeTransform {
  transform(unixSeconds?: number): string {
    if (!unixSeconds) {
      return "-";
    }
    const date = new Date(unixSeconds * 1000);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    if (sameYear) {
      return `${month}月${day}日 ${hh}:${mm}`;
    }
    return `${date.getFullYear()}年${month}月${day}日 ${hh}:${mm}`;
  }
}
