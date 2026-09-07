import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignVersionComponent, } from './campaign-version';

describe('CampaignVersion', () => {
  let component: CampaignVersionComponent;
  let fixture: ComponentFixture<CampaignVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignVersionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampaignVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy(); 
  });
});
