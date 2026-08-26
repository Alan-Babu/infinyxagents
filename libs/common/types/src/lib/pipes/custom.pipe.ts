import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "customCurrency",
})
export class CustomCurrencyPipe implements PipeTransform {
  transform(value: number, currencyCode?: string): string {
    let currency = "AED";
    if (typeof value === "number") {
      if (currencyCode) {
        return `${currencyCode} ${value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;
      } else {
        return `${currency} ${value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;
      }
    }
    return value;
  }
}

@Pipe({
  name: "amountToWords",
})
export class AmountToWordsPipe implements PipeTransform {
  private units: string[] = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  private teens: string[] = [
    "",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  private tens: string[] = [
    "",
    "ten",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  private thousands: string[] = ["", "thousand", "million", "billion"];

  transform(value: number): string {
    if (value === 0) {
      return "zero";
    }

    return this.convertNumberToWords(value);
  }

  private convertNumberToWords(num: number): string {
    if (num === 0) {
      return "";
    }

    if (num < 10) {
      return this.units[num];
    }

    if (num < 20) {
      return this.teens[num - 10];
    }

    if (num < 100) {
      return (
        this.tens[Math.floor(num / 10)] +
        (num % 10 > 0 ? " " + this.units[num % 10] : "")
      );
    }

    if (num < 1000) {
      return (
        this.units[Math.floor(num / 100)] +
        " hundred" +
        (num % 100 > 0 ? " and " + this.convertNumberToWords(num % 100) : "")
      );
    }

    for (let i = 0, unit = 1; i < this.thousands.length; i++, unit *= 1000) {
      if (num < unit * 1000) {
        return (
          this.convertNumberToWords(Math.floor(num / unit)) +
          " " +
          this.thousands[i] +
          (num % unit > 0 ? " " + this.convertNumberToWords(num % unit) : "")
        );
      }
    }

    return "";
  }
}
