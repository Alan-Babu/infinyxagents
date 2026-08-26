import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Loader } from '@nfinyx/loader';

@Component({
  imports: [RouterModule, Loader],
  selector: 'app-root',
  templateUrl: './app.html',
  styles: ``,
})
export class App {
  protected title = 'mofa';
}
