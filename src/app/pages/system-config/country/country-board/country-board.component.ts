import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { Router } from 'express';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { CountryService } from '../../../../services/system-configuration/country.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMiniFabButton, MatIconButton, MatAnchor, MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { VDividerComponent } from '@elementar/components';
import { RouterLink,Router } from '@angular/router';
import {
  EmptyStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  TableToolbarComponent,
} from '@shared/ui';

@Component({
  selector: 'app-country-board',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatDivider,
    MatIcon,
    MatMiniFabButton,
    MatIconButton,
    VDividerComponent,
    MatTooltip,
    MatSlideToggleModule,
    FormsModule,
    MatAnchor,
    MatButton,
    RouterLink,
    EmptyStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent
  ],
  templateUrl: './country-board.component.html',
  styleUrl: './country-board.component.scss'
})
export class CountryBoardComponent implements OnInit,OnDestroy{
  private readonly onDestroy = new Subject<void>()

  displayedColumns: string[] = ['id','name','code','action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public permission: PermissionService,
    public countryService: CountryService,
    private route:Router,
    ){}

  ngOnInit(): void {
    this.countryDataTable();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.countryDataTable();
  }

  countryDataTable() {
    this.countryService.getAllCountry().pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
      if(response.statusCode==200){
        this.dataSource = new MatTableDataSource(response.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }if(response.statusCode==401){
        this.route.navigateByUrl("/")
        // console.log(response.message)
      }
    },(error)=>{
      this.route.navigateByUrl("/")
      // console.log('country getAway api fail to load')
    })
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

}
