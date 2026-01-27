import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyUsers } from './company-users';

describe('CompanyUsers', () => {
  let component: CompanyUsers;
  let fixture: ComponentFixture<CompanyUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyUsers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyUsers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
