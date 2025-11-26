import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainDisplay } from './main-display';

describe('MainDisplay', () => {
  let component: MainDisplay;
  let fixture: ComponentFixture<MainDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
