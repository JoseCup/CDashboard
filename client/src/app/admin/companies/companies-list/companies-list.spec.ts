import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompaniesList } from './companies-list';

describe('CompaniesList', () => {
  let component: CompaniesList;
  let fixture: ComponentFixture<CompaniesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompaniesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompaniesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
