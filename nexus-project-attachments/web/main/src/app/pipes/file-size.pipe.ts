import { Pipe, type PipeTransform } from "@angular/core";

@Pipe({
  name: "fileSize",
})
export class FileSizePipe implements PipeTransform {
  transform(bytes?: number): string {
    if (bytes == null || Number.isNaN(bytes)) {
      return "-";
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${this.trimNumber(kb)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${this.trimNumber(mb)} MB`;
    }
    return `${this.trimNumber(mb / 1024)} GB`;
  }

  private trimNumber(n: number): string {
    const fixed = n >= 100 ? n.toFixed(0) : n.toFixed(1);
    return fixed.replace(/\.0$/, "");
  }
}
