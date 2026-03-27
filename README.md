# The Birss App

Calculates non-zero susceptibility tensor components (Electric Dipole, Magnetic Dipole, Electric Quadrupole) and induced transverse Second Harmonic Generation (SHG) source terms for all 32 crystallographic and 122 magnetic point groups.

### [Live Demo](https://manganite.github.io/birss-app/)

## Features
- **Point Group Analysis**: Detailed symmetry classification for all 32 crystallographic and 122 magnetic point groups.
- **Tensor Calculation**: Automatic determination of non-zero and independent components for Electric Dipole (ED, $\chi^{(2)}$), Magnetic Dipole (MD), and Electric Quadrupole (EQ) tensors, including Time-Reversal symmetry (i-type, c-type).
- **SHG Source Terms**: Real-time calculation of induced nonlinear response in the Lab Frame ($S_X, S_Y, S_Z$) with incoming light propagating along the Z-axis ($E_Z = 0$). Includes crystal rotation controls ($\theta_X$, $\theta_Y$) to simulate experimental setups.
- **Coordinate Systems**: Clear distinction and transformation between the Crystal Frame (for tensor components) and the Lab Frame (for observables).
- **Symmetry-Aware Rendering**: Correct mathematical notation with subscripts and superscripts for all physical symbols.
- **Responsive Design**: Optimized for both desktop and mobile viewing.

## References
The symmetry relations and calculations presented in this app follow the conventions established in the following literature:
- **[International Tables for Crystallography](https://doi.org/10.1107/97809553602060000114)**: General crystal symmetry aspects.
- **[Birss, R. R. (1966). Symmetry and Magnetism](https://ethz.ch/content/dam/ethz/special-interest/matl/multi-ferroic-materials-dam/documents/education/Nonlinear%20Optics%20on%20Ferroic%20Materials/Birss%20Symmetry%20&%20Magnetism%20komplett.pdf)**: Magnetic point groups and tensor component calculation.
- **[Pershan, P. S. (1963). Nonlinear Optical Properties of Solids](https://doi.org/10.1103/PhysRev.130.919)**: Nonlinear optical multipole contributions.
- **[Fröhlich, D., et al. (1999). Nonlinear spectroscopy of antiferromagnetics](https://doi.org/10.1007/s003400050650)**: Source term calculation.

## Tech Stack
- **Developed with [Google AI Studio](https://ai.studio/build)** — Built, iterated, and deployed using natural language prompting.
- **React 19** + **Vite**
- **Tailwind CSS** for styling
- **Lucide React** for iconography
- **GitHub Actions** for automated deployment to GitHub Pages

## Running Locally
1. Clone the repo: `git clone https://github.com/manganite/birss-app.git`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`
