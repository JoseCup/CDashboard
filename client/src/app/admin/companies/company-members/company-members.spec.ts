import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyMembersComponent } from './company-members';

describe('CompanyMembersComponent', () => {
  let component: CompanyMembersComponent;
  let fixture: ComponentFixture<CompanyMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
