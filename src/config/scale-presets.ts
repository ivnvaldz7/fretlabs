export interface ScalePreset {
  id: string;
  name: string;
  description: string;
  category: 'equal-temperament' | 'just-intonation' | 'historical' | 'microtonal';
  sclContent: string;
}

export const SCALE_PRESETS: ScalePreset[] = [
  {
    id: '12-tet',
    name: '12-TET',
    description: '12-Tone Equal Temperament (standard)',
    category: 'equal-temperament',
    sclContent: `! 12-tet.scl
!
12-Tone Equal Temperament (standard)
 12
100.
200.
300.
400.
500.
600.
700.
800.
900.
1000.
1100.
2/1`,
  },
  {
    id: '19-tet',
    name: '19-TET',
    description: '19-Tone Equal Temperament',
    category: 'equal-temperament',
    sclContent: `! 19-tet.scl
!
19-Tone Equal Temperament
 19
 63.157895
 126.315789
 189.473684
 252.631579
 315.789474
 378.947368
 442.105263
 505.263158
 568.421053
 631.578947
 694.736842
 757.894737
 821.052632
 884.210526
 947.368421
 1010.526316
 1073.684211
 1136.842105
2/1`,
  },
  {
    id: '24-tet',
    name: '24-TET',
    description: '24-Tone Equal Temperament (quarter tones)',
    category: 'equal-temperament',
    sclContent: `! 24-tet.scl
!
24-Tone Equal Temperament (quarter tones)
 24
 50.
 100.
 150.
 200.
 250.
 300.
 350.
 400.
 450.
 500.
 550.
 600.
 650.
 700.
 750.
 800.
 850.
 900.
 950.
 1000.
 1050.
 1100.
 1150.
2/1`,
  },
  {
    id: '31-tet',
    name: '31-TET',
    description: '31-Tone Equal Temperament',
    category: 'equal-temperament',
    sclContent: `! 31-tet.scl
!
31-Tone Equal Temperament
 31
 38.709677
 77.419355
 116.129032
 154.838710
 193.548387
 232.258065
 270.967742
 309.677419
 348.387097
 387.096774
 425.806452
 464.516129
 503.225806
 541.935484
 580.645161
 619.354839
 658.064516
 696.774194
 735.483871
 774.193548
 812.903226
 851.612903
 890.322581
 929.032258
 967.741935
 1006.451613
 1045.161290
 1083.870968
 1122.580645
 1161.290323
2/1`,
  },
  {
    id: '53-tet',
    name: '53-TET',
    description: '53-Tone Equal Temperament',
    category: 'equal-temperament',
    sclContent: `! 53-tet.scl
!
53-Tone Equal Temperament
 53
 22.641509
 45.283019
 67.924528
 90.566038
 113.207547
 135.849057
 158.490566
 181.132075
 203.773585
 226.415094
 249.056604
 271.698113
 294.339623
 316.981132
 339.622642
 362.264151
 384.905660
 407.547170
 430.188679
 452.830189
 475.471698
 498.113208
 520.754717
 543.396226
 566.037736
 588.679245
 611.320755
 633.962264
 656.603774
 679.245283
 701.886792
 724.528302
 747.169811
 769.811321
 792.452830
 815.094340
 837.735849
 860.377358
 883.018868
 905.660377
 928.301887
 950.943396
 973.584906
 996.226415
 1018.867925
 1041.509434
 1064.150943
 1086.792453
 1109.433962
 1132.075472
 1154.716981
 1177.358491
2/1`,
  },
  {
    id: 'just-5-limit',
    name: '5-limit Just Intonation',
    description: "Ptolemy's intense diatonic",
    category: 'just-intonation',
    sclContent: `! just-5-limit.scl
!
5-limit Just Intonation (Ptolemy's intense diatonic)
 12
1/1
16/15
9/8
6/5
5/4
4/3
45/32
3/2
8/5
5/3
16/9
15/8
2/1`,
  },
  {
    id: 'pythagorean',
    name: 'Pythagorean',
    description: 'Pythagorean Tuning',
    category: 'historical',
    sclContent: `! pythagorean.scl
!
Pythagorean Tuning
 12
1/1
256/243
9/8
32/27
81/64
4/3
729/512
3/2
128/81
27/16
16/9
243/128
2/1`,
  },
  {
    id: 'just-7-limit',
    name: '7-limit Just Intonation',
    description: '7-limit Just Intonation',
    category: 'just-intonation',
    sclContent: `! just-7-limit.scl
!
7-limit Just Intonation
 12
1/1
15/14
9/8
6/5
5/4
4/3
7/5
3/2
8/5
5/3
7/4
15/8
2/1`,
  },
  {
    id: 'bohlen-pierce',
    name: 'Bohlen-Pierce',
    description: 'Bohlen-Pierce 13-step scale (3:1 pseudo-octave)',
    category: 'microtonal',
    sclContent: `! bohlen-pierce.scl
!
Bohlen-Pierce 13-step scale (3:1 pseudo-octave)
 13
 63.157895
 126.315789
 189.473684
 252.631579
 315.789474
 378.947368
 442.105263
 505.263158
 568.421053
 631.578947
 694.736842
 757.894737
3/1`,
  },
  {
    id: 'arabic-maqam',
    name: 'Arabic Maqam',
    description: 'Arabic Maqam Scale (quarter tones)',
    category: 'microtonal',
    sclContent: `! arabic-maqam.scl
!
Arabic Maqam Scale (quarter tones)
 24
 50.
 100.
 150.
 200.
 250.
 300.
 350.
 400.
 450.
 500.
 550.
 600.
 650.
 700.
 750.
 800.
 850.
 900.
 950.
 1000.
 1050.
 1100.
 1150.
2/1`,
  },
];

export const PRESET_12TET_SCL = SCALE_PRESETS.find((p) => p.id === '12-tet')!.sclContent;
