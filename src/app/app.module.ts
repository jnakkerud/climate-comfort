import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

import { DataLoaderService } from './data-loader.service';
import { ClimateScoreService } from './climate-score.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [DataLoaderService, ClimateScoreService],
  bootstrap: [AppComponent]
})
export class AppModule { }
