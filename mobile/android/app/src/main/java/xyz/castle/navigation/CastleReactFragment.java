package xyz.castle.navigation;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.reactnativenavigation.react.NavigationActivity;

import androidx.fragment.app.Fragment;

public class CastleReactFragment extends Fragment {

    private String mComponentName;

    public CastleReactFragment(String componentName) {
        mComponentName = componentName;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return new CastleReactView(getContext(), ((NavigationActivity) getActivity()).getReactGateway().reactInstanceManager(), mComponentName, mComponentName);
    }
}
